// src/schemas/user.schema.ts (new file)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;  // Hashed

  @Prop({ required: true })
  countryCode: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true, enum: ['admin', 'user'] })
  role: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organization: MongooseSchema.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);