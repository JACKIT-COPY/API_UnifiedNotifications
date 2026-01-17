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

  // ── NEW: Per-org credentials (optional, falls back to .env) ──
  @Prop({ type: Object, default: {} })
  credentials: Record<string, string>;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
