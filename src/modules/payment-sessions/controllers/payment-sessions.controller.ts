import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { PaymentSessionsService } from '../services/payment-sessions.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard';
import { ConfigService } from '@nestjs/config';

@Controller()
export class PaymentSessionsController {
  constructor(private readonly sessionsService: PaymentSessionsService, private readonly config: ConfigService) {}

  @Post('organizations/:id/public-pay-session')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createSession(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    // body: { amount?, mode?, expiresInMinutes? }
    const createdBy = req.user?.id || req.user?.sub || 'unknown';
    // For safety, snapshot rates on create if provided
    const ratesSnapshot = body.rates || undefined;

    const session = await this.sessionsService.createForOrg(id, { amount: body.amount, mode: body.mode, expiresInMinutes: body.expiresInMinutes, ratesSnapshot, createdBy });

    const publicUrlBase = this.config.get('PUBLIC_URL') || this.config.get('APP_URL') || `http://localhost:3000`;

    return { url: `${publicUrlBase.replace(/\/$/, '')}/pay/${session.sessionToken}`, session };
  }
}
