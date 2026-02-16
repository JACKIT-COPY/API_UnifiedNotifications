import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentSessionDocument = PaymentSession & Document;

@Schema({ timestamps: true })
export class PaymentSession {
  @Prop({ required: true, unique: true })
  sessionToken: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop()
  amount?: number;

  @Prop({ default: 'flexible' })
  mode: string; // 'fixed' | 'flexible'

  @Prop({ type: Object })
  ratesSnapshot: any;

  @Prop()
  expiresAt: Date;

  @Prop({ default: 'pending' })
  status: string; // pending | processing | completed | failed

  @Prop()
  gatewayReference?: string;

  @Prop()
  phone?: string;

  @Prop()
  createdBy?: string;
}

export const PaymentSessionSchema = SchemaFactory.createForClass(PaymentSession);
