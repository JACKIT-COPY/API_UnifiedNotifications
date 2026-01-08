import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Contact extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  organization: string;  // Company of the contact

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Group' }], default: [] })
  groups: MongooseSchema.Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  notifyHubOrganization: MongooseSchema.Types.ObjectId;  // The NotifyHub org owning this contact
}

export const ContactSchema = SchemaFactory.createForClass(Contact);