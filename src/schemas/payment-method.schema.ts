// src/schemas/payment-method.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentMethodDocument = Document & PaymentMethod;

@Schema({ timestamps: true })
export class PaymentMethod {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['mpesa'], default: 'mpesa' })
    type: string;

    @Prop({ required: true, default: 'M-Pesa STK Push' })
    provider: string;

    @Prop({ required: true })
    shortcode: string; // Paybill or Till number

    @Prop({ required: true })
    passkey: string; // Encrypted in production

    @Prop({ required: true })
    consumerKey: string; // Encrypted in production

    @Prop({ required: true })
    consumerSecret: string; // Encrypted in production

    @Prop({ required: true, enum: ['paybill', 'till'], default: 'paybill' })
    mpesaType: string;

    @Prop({ required: false })
    storeNumber?: string; // For Buy Goods (Till), BusinessShortCode should be Store Number

    @Prop({ required: true, enum: ['sandbox', 'production'], default: 'production' })
    environment: string;

    @Prop({ default: false })
    isDefault: boolean;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: 0 })
    transactionCount: number;

    @Prop({ type: Date, default: null })
    lastUsed: Date;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
