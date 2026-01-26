// src/schemas/campaign.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { NotificationType } from 'src/integrations/interfaces/notification.interface';

@Schema({ timestamps: true })
export class Campaign extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ enum: ['broadcast', 'targeted', 'automated', 'recurring'], required: true })
  type: string;

  @Prop({ type: [String], enum: NotificationType, default: [] })
  channels: NotificationType[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organization: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ enum: ['draft', 'scheduled', 'active', 'completed', 'canceled'], default: 'draft' })
  status: string;

  @Prop({ type: [String], default: [] })  // Contact IDs
  recipients: string[];

  @Prop({ type: String })  // Group ID if targeted
  groupId?: string;

  @Prop({ type: Object, default: {} })  // Per-channel messages
  messages: Record<string, { subject?: string; content: string; attachments?: any[] }>;

  @Prop({ type: Date })
  scheduleDate?: Date;

  @Prop({ default: false })
  saveAsDraft: boolean;

  @Prop({ type: Object, default: { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0 } })
  analytics: Record<string, number>;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);