import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { ISmsProvider } from '../../../interfaces/sms-provider.interface';
import { SMSInterface } from '../../../lancola-sms/services/lancola-sms/sms.interface';
import { OrganizationsService } from '../../../../modules/organizations/services/organizations/organizations.service';

@Injectable()
export class BelioSmsService implements ISmsProvider {
  private readonly logger = new Logger(BelioSmsService.name);

  constructor(private readonly organizationsService: OrganizationsService) {}

  async sendSMS(payload: SMSInterface, config: any): Promise<any> {
    const { orgId } = config;
    if (!orgId) throw new BadRequestException('Organization ID is required for Belio SMS');

    const clientId = config.belio_clientId || process.env.BELIO_CLIENT_ID;
    const clientSecret = config.belio_clientSecret || process.env.BELIO_CLIENT_SECRET;
    const serviceId = config.belio_serviceId || process.env.BELIO_SERVICE_ID;

    if (!clientId || !clientSecret || !serviceId) {
      throw new BadRequestException('Missing Belio SMS credentials (clientId, clientSecret, or serviceId)');
    }

    const token = await this.getValidToken(orgId, clientId, clientSecret);

    const belioPayload = {
      type: 'SendToEach',
      messages: [
        {
          text: payload.message,
          phone: payload.phone,
        },
      ],
    };

    try {
      const response = await axios.post(
        `https://api.belio.co.ke/message/${serviceId}`,
        belioPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`[Belio SMS] Sent to ${payload.phone}. Response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Belio SMS send failed: ${error.response?.data?.message || error.message}`);
      throw new BadRequestException(`Failed to send SMS via Belio: ${error.message}`);
    }
  }

  private async getValidToken(orgId: string, clientId: string, clientSecret: string): Promise<string> {
    const org = await this.organizationsService.getById(orgId);
    const state = org.providerState?.belio || {};

    const now = Math.floor(Date.now() / 1000);
    // Refresh if no token or expires in less than 5 minutes
    if (state.accessToken && state.expiresAt && state.expiresAt > now + 300) {
      return state.accessToken;
    }

    this.logger.log(`[Belio SMS] Requesting new access token for org: ${orgId}`);
    try {
      const response = await axios.post(
        'https://account.belio.co.ke/realms/api/protocol/openid-connect/token',
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const { access_token, expires_in } = response.data;
      const expiresAt = now + expires_in;

      await this.organizationsService.updateProviderState(orgId, {
        belio: {
          accessToken: access_token,
          expiresAt: expiresAt,
        },
      });

      return access_token;
    } catch (error) {
      this.logger.error(`Belio authentication failed: ${error.response?.data?.error_description || error.message}`);
      throw new BadRequestException(`Failed to authenticate with Belio: ${error.message}`);
    }
  }
}
