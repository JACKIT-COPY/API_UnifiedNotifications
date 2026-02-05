// src/schemas/organization.schema.ts (new file)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Organization extends Document {
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
  @Prop({ type: Object, default: {} })
  credentials: Record<string, string>;

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
