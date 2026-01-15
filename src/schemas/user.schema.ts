// src/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // Hashed

  @Prop({ required: true })
  countryCode: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true, enum: ['admin', 'user'] })
  role: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean; // Soft delete / deactivation flag
}

export const UserSchema = SchemaFactory.createForClass(User);
