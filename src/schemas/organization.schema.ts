// src/schemas/organization.schema.ts (new file)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Organization extends Document {
  createdAt: Date;
  updatedAt: Date;

  @Prop({ required: true, unique: true })
  name: string; // Company name

  @Prop({ required: true })
  sector: string;

  @Prop({ required: true })
  country: string;

  @Prop({ default: 0 })
  credits: number; // For future

  @Prop({ type: String, default: null })
  emailFromName: string; // overrides org.name

  // ── NEW: Per-org credentials (optional, falls back to .env) ──
  @Prop({
    type: Object,
    default: {
      LANCOLA_SMS_APIURL: 'https://sms.lancolatech.com/api/services/sendsms/?apikey=',
      LANCOLA_SMS_apiKey: 'dde2efa9e40d31eae58cd7b1f89c139e',
      LANCOLA_SMS_partnerID: '8029',
      LANCOLA_SMS_shortCode: 'Maziwa Tele',
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '587',
      EMAIL_USER: 'uniflownotifications@gmail.com',
      EMAIL_PASS: 'oscoukeqivwaojmo',
    }
  })
  credentials: Record<string, string>;

  @Prop({ type: String, default: 'Active' })
  status: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({
    type: {
      sms: { type: Number, default: 1 },
      whatsapp: { type: Number, default: 1 },
      email: { type: Number, default: 0.5 },
    },
    default: {
      sms: 1,
      whatsapp: 1,
      email: 0.5,
    }
  })
  rates: {
    sms: number;
    whatsapp: number;
    email: number;
  };
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
