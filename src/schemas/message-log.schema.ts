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
  network: string;  // e.g., "Lancola SMS", "Gmail SMTP", "Meta WhatsApp"

  @Prop([
    {
      recipient: { type: String, required: true },
      status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
      error: { type: String },
      response: { type: String },
    },
  ])
  recipients: { recipient: string; status: string; error?: string; response?: string }[];

  @Prop({ required: true })
  messagePreview: string;  // Truncated message (first 100 chars)

  @Prop({ required: true })
  messageLength: number;  // Char count

  @Prop([{ filename: String, contentType: String }])
  attachments?: { filename: string; contentType: string }[];  // For email

  @Prop({ default: 0 })
  cost: number;  // Credits used
}

export const MessageLogSchema = SchemaFactory.createForClass(MessageLog);