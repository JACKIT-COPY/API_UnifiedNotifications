// src/schemas/transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TransactionDocument = Document & Transaction;

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
    organizationId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    userId: string; // The user who initiated the transaction (optional for public payments)

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    tokens: number;

    @Prop({ required: true, default: 'mpesa' })
    paymentMethod: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PaymentMethod' })
    paymentMethodId: string; // The specific configuration used

    @Prop({ required: true, default: 'pending', enum: ['pending', 'completed', 'failed'] })
    status: string;

    @Prop({ unique: true, sparse: true })
    mpesaReference: string; // M-Pesa transaction code (e.g., QWE12345)

    @Prop()
    checkoutRequestId: string; // M-Pesa CheckoutRequestID for STK Push

    @Prop()
    merchantRequestId: string;

    @Prop({ type: String })
    description: string;

    @Prop({ type: Object })
    metadata: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
