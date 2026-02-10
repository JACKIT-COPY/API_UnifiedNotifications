// src/modules/transactions/services/transactions/transactions.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from 'src/schemas/transaction.schema';
import { PaymentMethodsService } from 'src/modules/payment-methods/services/payment-methods/payment-methods.service';
import { InitiatePaymentDto } from '../../dto/initiate-payment.dto';
import { UserDocument } from 'src/schemas/user.schema';
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectModel(Transaction.name)
        private transactionModel: Model<TransactionDocument>,
        private organizationsService: OrganizationsService,
        private paymentMethodsService: PaymentMethodsService,
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
        await this.organizationsService.getById(orgId); // Throws if not found

        // 3. Calculate tokens (assuming 1 KES = 1 Token for now, or use complex rate logic)
        // Rate logic could be fetched from organization settings or global settings
        const rate = 1; // 1 KES = 1 Token
        const tokens = Math.floor(dto.amount * rate);

        // 4. Create Pending Transaction Record
        const transaction = new this.transactionModel({
            organizationId: orgId,
            userId: user._id || user.userId, // Depending on user object structure
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

        // 6. TODO: Call M-Pesa API here using credentials from paymentMethod
        // This would involve:
        // - Generating access token using consumerKey:consumerSecret
        // - Making STK Push request to Safaricom
        // - Updating transaction with CheckoutRequestID

        // For now, we simulate success or return the pending transaction
        return transaction;
    }

    // TODO: Add callback handler for M-Pesa to update transaction status
    // async handleCallback(payload: any) { ... }
}
