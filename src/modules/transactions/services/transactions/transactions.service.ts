// src/modules/transactions/services/transactions/transactions.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from 'src/schemas/transaction.schema';
import { PaymentMethodsService } from 'src/modules/payment-methods/services/payment-methods/payment-methods.service';
import { InitiatePaymentDto } from '../../dto/initiate-payment.dto';
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';
import { PaymentSessionsService } from 'src/modules/payment-sessions/services/payment-sessions.service';
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
        private paymentSessionsService: PaymentSessionsService,
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
        // 1. Validate organization
        const orgId = dto.organizationId || user.organization;
        const org = await this.organizationsService.getById(orgId); // Throws if not found

        // 2. Determine which payment method to use
        let paymentMethod;
        if (dto.paymentMethodId) {
            paymentMethod = await this.paymentMethodsService.findOne(dto.paymentMethodId);
        } else if (org.paymentMethod) {
            // Use organization-specific payment method
            try {
                paymentMethod = await this.paymentMethodsService.findOne(org.paymentMethod.toString());
            } catch (error) {
                console.warn(`Organization assigned payment method ${org.paymentMethod} not found, falling back to default`);
                paymentMethod = await this.paymentMethodsService.findDefault();
            }
        } else {
            paymentMethod = await this.paymentMethodsService.findDefault();
        }

        if (!paymentMethod || !paymentMethod.isActive) {
            throw new BadRequestException('No active payment method available');
        }

        // 3. Calculate tokens (assuming 1 KES = 1 Token)
        const rate = 1;
        const tokens = Math.floor(dto.amount * rate);

        // 4. Create Pending Transaction Record
        const userId = user._id || user.userId;
        const transactionData: any = {
            organizationId: orgId,
            amount: dto.amount,
            tokens: tokens,
            paymentMethod: 'mpesa',
            paymentMethodId: paymentMethod._id,
            status: 'pending',
            description: `Purchase of ${tokens} tokens via ${paymentMethod.name}`,
            metadata: {
                phoneNumber: dto.phoneNumber,
                initiatedAt: new Date(),
                environment: paymentMethod.environment,
                source: userId ? 'dashboard' : 'payment-session',
                sessionToken: (dto as any).sessionToken || undefined,
            }
        };
        if (userId) {
            transactionData.userId = userId;
        }
        const transaction = new this.transactionModel(transactionData);

        await transaction.save();

        // 5. Update Payment Method Usage
        await this.paymentMethodsService.incrementUsage(paymentMethod._id.toString());

        // 6. Handle M-Pesa STK Push
        try {
            let phoneNumber = dto.phoneNumber.replace(/\D/g, '');
            if (phoneNumber.startsWith('0')) {
                phoneNumber = '254' + phoneNumber.substring(1);
            } else if (phoneNumber.length === 9) {
                phoneNumber = '254' + phoneNumber;
            }

            // Determine Transaction Parameters
            // If the user called it "Paybill" in the name, we should probably prefer paybill type
            // But let's look at the mpesaType field first
            const mpesaType = paymentMethod.mpesaType || (paymentMethod.shortcode.length > 6 ? 'till' : 'paybill');
            const transactionType = mpesaType === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';

            // For Till Numbers, BusinessShortCode should be the Store Number
            // If not provided, fallback to shortcode (but this might cause Error 2002)
            const businessShortCode = mpesaType === 'till'
                ? (paymentMethod.storeNumber || paymentMethod.shortcode)
                : paymentMethod.shortcode;

            const partyB = paymentMethod.shortcode;

            // Generate Access Token
            const auth = Buffer.from(`${paymentMethod.consumerKey}:${paymentMethod.consumerSecret}`).toString('base64');
            const tokenUrl = paymentMethod.environment === 'sandbox'
                ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
                : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

            console.log(`[M-Pesa] Fetching token for ${paymentMethod.name} (${paymentMethod.environment})`);

            const tokenResponse = await firstValueFrom(
                this.httpService.get(tokenUrl, {
                    headers: { Authorization: `Basic ${auth}` }
                })
            ).catch(err => {
                console.error('[M-Pesa] Token fetch failed:', err.response?.data || err.message);
                throw err;
            });

            const accessToken = tokenResponse.data.access_token;

            // Generate Password
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
            const password = Buffer.from(
                `${businessShortCode}${paymentMethod.passkey}${timestamp}`
            ).toString('base64');

            // STK Push Request
            const processRequestUrl = paymentMethod.environment === 'sandbox'
                ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
                : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

            const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/transactions/callback';

            const stkData = {
                BusinessShortCode: businessShortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: transactionType,
                Amount: Math.round(dto.amount),
                PartyA: phoneNumber,
                PartyB: partyB,
                PhoneNumber: phoneNumber,
                CallBackURL: callbackUrl,
                AccountReference: `Topup-${org.name.replace(/\s+/g, '')}`.slice(0, 12),
                TransactionDesc: `Token Purchase for ${org.name}`.slice(0, 20)
            };

            console.log(`[M-Pesa] Sending STK Push Request to ${processRequestUrl}:`, JSON.stringify(stkData));

            const stkResponse = await firstValueFrom(
                this.httpService.post(processRequestUrl, stkData, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ).catch(err => {
                console.error('[M-Pesa] STK Push failed:', err.response?.data || err.message);
                throw err;
            });

            console.log(`[M-Pesa] STK Push Response:`, JSON.stringify(stkResponse.data));

            // Update transaction with M-Pesa details
            transaction.checkoutRequestId = stkResponse.data.CheckoutRequestID;
            transaction.merchantRequestId = stkResponse.data.MerchantRequestID;
            transaction.metadata = {
                ...transaction.metadata,
                stkRequest: stkData,
                stkResponse: stkResponse.data,
                mpesaType,
                transactionType,
                businessShortCode,
                partyB,
                initiatedAt: new Date()
            };
            await transaction.save();

            return transaction;
        } catch (error) {
            const errorData = error.response?.data || error.message;
            console.error('[M-Pesa] Final Error Trace:', errorData);

            transaction.status = 'failed';
            transaction.metadata = {
                ...transaction.metadata,
                error: errorData,
                failedAt: new Date()
            };
            await transaction.save();
            throw new BadRequestException(error.response?.data?.CustomerMessage || 'Failed to initiate M-Pesa payment');
        }
    }

    /**
     * Handle M-Pesa Callback
     */
    async handleCallback(payload: any) {
        console.log('[M-Pesa] Raw Callback Payload:', JSON.stringify(payload));

        if (!payload.Body || !payload.Body.stkCallback) {
            console.error('[M-Pesa] Invalid callback payload format');
            return { ResultCode: 1, ResultDesc: 'Invalid payload' };
        }

        const stkCallback = payload.Body.stkCallback;
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;

        console.log(`[M-Pesa] Processing callback for CheckoutRequestID: ${checkoutRequestId}, ResultCode: ${resultCode}`);

        const transaction = await this.transactionModel.findOne({ checkoutRequestId });
        if (!transaction) {
            console.error(`[M-Pesa] Transaction not found for CheckoutRequestID: ${checkoutRequestId}`);
            return { ResultCode: 1, ResultDesc: 'Transaction not found' };
        }

        // Idempotency: if already completed, ignore repeated callbacks
        if (transaction.status === 'completed') {
            console.log(`[M-Pesa] Transaction ${transaction._id} already completed — ignoring duplicate callback`);
            return { ResultCode: 0, ResultDesc: 'Already processed' };
        }

        // Store full callback in metadata
        transaction.metadata = {
            ...transaction.metadata,
            callbackPayload: payload,
            callbackAt: new Date()
        };

        if (resultCode === 0) {
            // Success
            transaction.status = 'completed';

            // Extract MpesaReceiptNumber
            const callbackMetadata = stkCallback.CallbackMetadata?.Item;
            if (callbackMetadata) {
                const mpesaReference = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
                transaction.mpesaReference = mpesaReference;
            }

            await transaction.save();
            console.log(`[M-Pesa] Transaction ${transaction._id} completed successfully`);

            // UPDATE ORGANIZATION CREDITS
            try {
                await this.organizationsService.updateCredits(
                    transaction.organizationId,
                    transaction.tokens
                );
                console.log(`[M-Pesa] Credits updated for Org ${transaction.organizationId}`);
            } catch (credError) {
                console.error(`[M-Pesa] Failed to update credits for transaction ${transaction._id}:`, credError.message);
                // We don't change transaction status to failed here because payment WAS successful
            }
            // If this transaction maps to a payment session, mark it completed
            try {
                const checkoutId = transaction.checkoutRequestId || transaction.merchantRequestId;
                if (checkoutId) {
                    const session = await this.paymentSessionsService.findByGatewayReference(checkoutId);
                    if (session) {
                        await this.paymentSessionsService.markCompletedByGatewayRef(checkoutId, { phone: transaction.metadata?.phoneNumber, gatewayReference: checkoutId });
                        console.log(`[M-Pesa] Payment session ${session.sessionToken} marked completed`);
                    }
                }
            } catch (sessErr) {
                console.error('[M-Pesa] Failed to update payment session:', sessErr.message);
            }
        } else {
            // Failed
            transaction.status = 'failed';
            transaction.metadata = {
                ...transaction.metadata,
                resultDesc: stkCallback.ResultDesc,
                resultCode: resultCode
            };
            await transaction.save();
            console.log(`[M-Pesa] Transaction ${transaction._id} marked as failed: ${stkCallback.ResultDesc}`);
        }

        return { ResultCode: 0, ResultDesc: 'Success' };
    }
}
