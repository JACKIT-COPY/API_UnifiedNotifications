// src/modules/transactions/services/transactions/transactions.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from 'src/schemas/transaction.schema';
import { PaymentMethodsService } from 'src/modules/payment-methods/services/payment-methods/payment-methods.service';
import { InitiatePaymentDto } from '../../dto/initiate-payment.dto';
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectModel(Transaction.name)
        private transactionModel: Model<TransactionDocument>,
        private organizationsService: OrganizationsService,
        private paymentMethodsService: PaymentMethodsService,
        private readonly httpService: HttpService,
    ) { }

    /**
     * Get all transactions (for admin)
     */
    async findAll(): Promise<Transaction[]> {
        return this.transactionModel
            .find()
            .populate('organizationId', 'name')
            .populate('paymentMethodId', 'name provider')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Get transactions for a specific organization
     */
    async findByOrganization(organizationId: string): Promise<Transaction[]> {
        return this.transactionModel
            .find({ organizationId })
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Get a single transaction by ID
     */
    async findOne(id: string): Promise<Transaction> {
        const transaction = await this.transactionModel
            .findById(id)
            .populate('organizationId', 'name')
            .populate('paymentMethodId', 'name shortcode')
            .exec();

        if (!transaction) {
            throw new NotFoundException(`Transaction with ID ${id} not found`);
        }

        return transaction;
    }

    /**
     * Initiate a payment transaction (MPesa STK Push)
     */
    async initiatePayment(user: any, dto: InitiatePaymentDto): Promise<Transaction> {
        // 1. Determine which payment method to use
        let paymentMethod;
        if (dto.paymentMethodId) {
            paymentMethod = await this.paymentMethodsService.findOne(dto.paymentMethodId);
        } else {
            paymentMethod = await this.paymentMethodsService.findDefault();
        }

        if (!paymentMethod || !paymentMethod.isActive) {
            throw new BadRequestException('No active payment method available');
        }

        // 2. Validate organization
        const orgId = dto.organizationId || user.organization;
        const org = await this.organizationsService.getById(orgId); // Throws if not found

        // 3. Calculate tokens (assuming 1 KES = 1 Token)
        const rate = 1;
        const tokens = Math.floor(dto.amount * rate);

        // 4. Create Pending Transaction Record
        const transaction = new this.transactionModel({
            organizationId: orgId,
            userId: user._id || user.userId,
            amount: dto.amount,
            tokens: tokens,
            paymentMethod: 'mpesa',
            paymentMethodId: paymentMethod._id,
            status: 'pending',
            description: `Purchase of ${tokens} tokens via ${paymentMethod.name}`,
            metadata: {
                phoneNumber: dto.phoneNumber,
                initiatedAt: new Date(),
                environment: paymentMethod.environment
            }
        });

        await transaction.save();

        // 5. Update Payment Method Usage
        await this.paymentMethodsService.incrementUsage(paymentMethod._id.toString());

        // 6. Handle M-Pesa STK Push
        try {
            const phoneNumber = dto.phoneNumber.startsWith('+') ? dto.phoneNumber.substring(1) : dto.phoneNumber;

            // Generate Access Token
            const auth = Buffer.from(`${paymentMethod.consumerKey}:${paymentMethod.consumerSecret}`).toString('base64');
            const tokenUrl = paymentMethod.environment === 'sandbox'
                ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
                : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

            const tokenResponse = await firstValueFrom(
                this.httpService.get(tokenUrl, {
                    headers: { Authorization: `Basic ${auth}` }
                })
            );

            const accessToken = tokenResponse.data.access_token;

            // Generate Password
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
            const password = Buffer.from(
                `${paymentMethod.shortcode}${paymentMethod.passkey}${timestamp}`
            ).toString('base64');

            // STK Push Request
            const stkPushUrl = paymentMethod.environment === 'sandbox'
                ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/query' // Wait, this is query. Correct is /v1/processrequest
                : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

            // Correction: both use processrequest
            const processRequestUrl = paymentMethod.environment === 'sandbox'
                ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
                : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

            const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/transactions/callback';

            const stkData = {
                BusinessShortCode: paymentMethod.shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: paymentMethod.shortcode.length > 5 ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
                Amount: Math.round(dto.amount),
                PartyA: phoneNumber,
                PartyB: paymentMethod.shortcode,
                PhoneNumber: phoneNumber,
                CallBackURL: callbackUrl,
                AccountReference: `Topup-${org.name.replace(/\s+/g, '')}`.slice(0, 12),
                TransactionDesc: `Token Purchase for ${org.name}`.slice(0, 20)
            };

            const stkResponse = await firstValueFrom(
                this.httpService.post(processRequestUrl, stkData, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            );

            // Update transaction with M-Pesa details
            transaction.checkoutRequestId = stkResponse.data.CheckoutRequestID;
            transaction.merchantRequestId = stkResponse.data.MerchantRequestID;
            await transaction.save();

            return transaction;
        } catch (error) {
            console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
            // Don't fail the whole request, but return the transaction as pending/failed
            // In a real scenario, you might want to throw if STK push fails to initiate
            transaction.status = 'failed';
            transaction.metadata = { ...transaction.metadata, error: error.response?.data || error.message };
            await transaction.save();
            throw new BadRequestException(error.response?.data?.CustomerMessage || 'Failed to initiate M-Pesa payment');
        }
    }

    /**
     * Handle M-Pesa Callback
     */
    async handleCallback(payload: any) {
        const stkCallback = payload.Body.stkCallback;
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;

        const transaction = await this.transactionModel.findOne({ checkoutRequestId });
        if (!transaction) {
            console.error(`Transaction not found for CheckoutRequestID: ${checkoutRequestId}`);
            return { ResultCode: 1, ResultDesc: 'Transaction not found' };
        }

        if (resultCode === 0) {
            // Success
            transaction.status = 'completed';

            // Extract MpesaReceiptNumber
            const callbackMetadata = stkCallback.CallbackMetadata.Item;
            const mpesaReference = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
            transaction.mpesaReference = mpesaReference;

            await transaction.save();

            // UPDATE ORGANIZATION CREDITS
            await this.organizationsService.updateCredits(
                transaction.organizationId,
                transaction.tokens
            );
        } else {
            // Failed
            transaction.status = 'failed';
            transaction.metadata = {
                ...transaction.metadata,
                resultDesc: stkCallback.ResultDesc,
                resultCode: resultCode
            };
            await transaction.save();
        }

        return { ResultCode: 0, ResultDesc: 'Success' };
    }
}
