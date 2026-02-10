// src/schemas/api-key.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApiKeyDocument = HydratedDocument<ApiKey>;

@Schema({ timestamps: true })
export class ApiKey {
    @Prop({ required: true, unique: true })
    keyHash: string; // bcrypt-hashed API key — never stored in plaintext

    @Prop({ required: true, index: true })
    prefix: string; // First 8 chars of the key for lookup & display (e.g., "nk_a1b2c")

    @Prop({ required: true })
    name: string; // Developer-friendly label ("Production Key", "Testing Key")

    @Prop({
        type: Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    })
    organization: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    })
    createdBy: Types.ObjectId;

    @Prop({ type: [String], default: ['*'] })
    permissions: string[]; // e.g., ['notifications:send', 'contacts:read'] or ['*'] for all

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Date, default: null })
    lastUsedAt: Date;

    @Prop({ type: Date, default: null })
    expiresAt: Date; // Optional expiry — null means no expiry
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
