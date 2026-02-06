import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class RequestLog extends Document {
    @Prop({ required: true })
    method: string;

    @Prop({ required: true })
    url: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    body: any;

    @Prop({ type: MongooseSchema.Types.Mixed })
    query: any;

    @Prop({ required: true })
    statusCode: number;

    @Prop({ required: true })
    duration: number;

    @Prop()
    ip: string;

    @Prop()
    userAgent: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    userId?: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
    orgId?: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.Mixed })
    response?: any;

    @Prop()
    error?: string;
}

export const RequestLogSchema = SchemaFactory.createForClass(RequestLog);
