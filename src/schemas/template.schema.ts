import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Template extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true, enum: ['email', 'sms', 'whatsapp'] })
    channel: string;

    @Prop({ required: true })
    content: string;

    @Prop()
    subject: string;

    @Prop({ type: [String], default: [] })
    variables: string[];

    @Prop({ default: 0 })
    usage: number;

    @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
    organization: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
