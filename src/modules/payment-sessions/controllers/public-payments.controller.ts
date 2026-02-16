import { Controller, Get, Param, NotFoundException, Post, Body } from '@nestjs/common';
import { PaymentSessionsService } from '../services/payment-sessions.service';
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';
import { TransactionsService } from 'src/modules/transactions/services/transactions/transactions.service';

@Controller('public')
export class PublicPaymentsController {
  constructor(
    private readonly sessionsService: PaymentSessionsService,
    private readonly organizationsService: OrganizationsService,
    private readonly transactionsService: TransactionsService,
  ) { }

  @Get('pay/:token')
  async getSession(@Param('token') token: string) {
    const session = await this.sessionsService.findByToken(token);
    if (!session) throw new NotFoundException('Session not found');

    // Load organization basic info for display (safe fields only)
    const org = await this.organizationsService.getById(session.organizationId.toString());

    return {
      session: {
        sessionToken: session.sessionToken,
        amount: session.amount,
        mode: session.mode,
        ratesSnapshot: session.ratesSnapshot,
        expiresAt: session.expiresAt,
        status: session.status,
        organization: {
          name: org.name,
          logo: (org as any).logo ?? null,
        }
      }
    };
  }

  @Post('pay/:token/initiate')
  async initiate(@Param('token') token: string, @Body() body: any) {
    // body: { phone, amount }
    const session = await this.sessionsService.setProcessing(token, { phone: body.phone, amount: body.amount });

    const orgId = session.organizationId.toString();

    // Construct a pseudo-user with organization context for TransactionsService
    const systemUser: any = { organization: orgId, _id: undefined };

    const dto = {
      amount: body.amount,
      phoneNumber: body.phone,
      organizationId: orgId,
      sessionToken: session.sessionToken,
    };

    const transaction = await this.transactionsService.initiatePayment(systemUser, dto as any);

    // Update session with gateway reference if available (do not mark completed yet)
    try {
      const gatewayRef = transaction.checkoutRequestId || transaction.merchantRequestId;
      if (gatewayRef) {
        await this.sessionsService.setGatewayReference(token, gatewayRef);
      }
    } catch (err) {
      // ignore update failure for now, webhook will handle marking completed
    }

    return { transactionId: (transaction as any)._id, checkoutRequestId: transaction.checkoutRequestId };
  }
}
