// src/integrations/lancola-whatsapp/services/lancola-whatsapp/lancola-whatsapp.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';
import { WhatsAppPayload } from './whatsapp.interface';
import { phoneNumberWithCountryCode } from 'src/integrations/lancola-sms/services/lancola-sms/lancola-sms.functions';

@Injectable()
export class LancolaWhatsAppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async sendWhatsApp(payload: WhatsAppPayload, orgId: string): Promise<void> {
    const org = await this.organizationsService.getById(orgId);
    const creds = org.credentials || {};

    const accessToken = creds.whatsapp_access_token || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = creds.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = creds.whatsapp_api_version || process.env.WHATSAPP_API_VERSION;

    if (!accessToken || !phoneNumberId || !apiVersion) {
      throw new InternalServerErrorException('Missing required WhatsApp credentials');
    }

    const formattedPhone = phoneNumberWithCountryCode({ phoneNumber: payload.to, countryCode: '254' });

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const data = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: 'cedars_newcase_alert',
        language: { code: 'en_US' },
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      console.log('WhatsApp API Response:', response.data);

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to send WhatsApp message: ${error.message}`);
    }
  }
}