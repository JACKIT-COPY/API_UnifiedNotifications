// src/schemas/message-log.schema.ts (update to add campaignId)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { NotificationType } from 'src/integrations/interfaces/notification.interface';

@Schema({ timestamps: true })
export class MessageLog extends Document {
  @Prop({ required: true, enum: NotificationType })
  channel: NotificationType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderUserId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  senderOrgId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  network: string;

  @Prop([
    {
      recipient: { type: String, required: true },
      status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
      error: { type: String },
    },
  ])
  recipients: { recipient: string; status: string; error?: string }[];

  @Prop({ required: true })
  messagePreview: string;

  @Prop()
  fullMessage?: string;

  @Prop({ required: true })
  messageLength: number;

  @Prop([{ filename: String, contentType: String }])
  attachments?: { filename: string; contentType: string }[];

  @Prop({ default: 0 })
  cost: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Campaign', default: null })  // ← New field for linking to campaign
  campaignId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: null })
  scheduledAt?: Date;

  @Prop({ type: String, enum: ['scheduled', 'sent', 'failed', 'pending', 'processing'], default: 'pending' })
  status: string;
}

export const MessageLogSchema = SchemaFactory.createForClass(MessageLog);