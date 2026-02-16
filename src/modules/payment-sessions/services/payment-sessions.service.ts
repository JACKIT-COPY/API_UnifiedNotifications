import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentSession, PaymentSessionDocument } from '../schemas/payment-session.schema';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentSessionsService {
  constructor(
    @InjectModel(PaymentSession.name) private paymentSessionModel: Model<PaymentSessionDocument>,
  ) {}

  async createForOrg(orgId: string, opts: { amount?: number; mode?: string; expiresInMinutes?: number; ratesSnapshot?: any; createdBy?: string }) {
    const token = randomBytes(18).toString('hex');
    const expiresAt = opts.expiresInMinutes ? new Date(Date.now() + opts.expiresInMinutes * 60000) : new Date(Date.now() + 24 * 60 * 60000);

    const doc = await this.paymentSessionModel.create({
      sessionToken: token,
      organizationId: orgId,
      amount: opts.amount,
      mode: opts.mode || 'flexible',
      ratesSnapshot: opts.ratesSnapshot || {},
      expiresAt,
      status: 'pending',
      createdBy: opts.createdBy,
    });

    return doc;
  }

  async findByToken(token: string) {
    return this.paymentSessionModel.findOne({ sessionToken: token }).lean();
  }

  async findByGatewayReference(gatewayReference: string) {
    return this.paymentSessionModel.findOne({ gatewayReference }).exec();
  }

  async setProcessing(token: string, update: Partial<PaymentSession>) {
    const doc = await this.paymentSessionModel.findOneAndUpdate({ sessionToken: token, status: 'pending' }, { $set: { status: 'processing', ...update } }, { new: true });
    if (!doc) throw new NotFoundException('Payment session not found or already processed');
    return doc;
  }

  async markCompletedByGateway(token: string, gatewayReference: string, extra: Partial<PaymentSession> = {}) {
    const doc = await this.paymentSessionModel.findOneAndUpdate({ sessionToken: token }, { $set: { status: 'completed', gatewayReference, ...extra } }, { new: true });
    if (!doc) throw new NotFoundException('Payment session not found');
    return doc;
  }

  async markCompletedByGatewayRef(gatewayReference: string, extra: Partial<PaymentSession> = {}) {
    const doc = await this.paymentSessionModel.findOneAndUpdate({ gatewayReference }, { $set: { status: 'completed', ...extra } }, { new: true });
    return doc;
  }

  async setGatewayReference(token: string, gatewayReference: string) {
    return this.paymentSessionModel.findOneAndUpdate({ sessionToken: token }, { $set: { gatewayReference } }, { new: true });
  }
}
