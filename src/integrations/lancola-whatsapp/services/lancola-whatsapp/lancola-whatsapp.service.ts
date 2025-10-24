import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { getLancolaWhatsAppConfig } from '../../lancola-whatsapp.config';
import { WhatsAppPayload } from './whatsapp.interface';
import { phoneNumberWithCountryCode } from 'src/integrations/lancola-sms/services/lancola-sms/lancola-sms.functions';

@Injectable()
export class LancolaWhatsAppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendWhatsApp(payload: WhatsAppPayload): Promise<void> {
    try {
      const config = getLancolaWhatsAppConfig(this.configService);
      if (!config.ACCESS_TOKEN || !config.PHONE_NUMBER_ID) {
        throw new Error('Missing WhatsApp configuration');
      }

      // Format phone number to international format (e.g., +254...)
      const formattedPhone = phoneNumberWithCountryCode({
        phoneNumber: payload.to,
        countryCode: '254',
      });

      const response = await firstValueFrom(
        this.httpService.post(
          `https://graph.facebook.com/${config.API_VERSION}/${config.PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
              name: 'cedars_newcase_alert',
              language: { code: 'en_US' },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${config.ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          },
        ),
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