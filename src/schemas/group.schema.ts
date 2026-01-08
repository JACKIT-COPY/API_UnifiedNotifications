import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Group extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  color: string;  // e.g., 'bg-blue-500/10 text-blue-500 border-blue-500/20'

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organization: MongooseSchema.Types.ObjectId;
}

export const GroupSchema = SchemaFactory.createForClass(Group);