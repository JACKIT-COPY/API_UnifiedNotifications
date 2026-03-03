// src/integrations/lancola-sms/services/lancola-sms/lancola-sms.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { phoneNumberWithCountryCode, prepareMessage, LancolaSmsConfig } from './lancola-sms.functions';
import { SMSInterface } from './sms.interface';


import { ISmsProvider } from '../../../interfaces/sms-provider.interface';


@Injectable()
export class LancolaSmsService implements ISmsProvider {
  private readonly logger = new Logger(LancolaSmsService.name);

  constructor() { }

  async sendSMS(payload: SMSInterface, config: any) {
    const lancolaConfig: LancolaSmsConfig = {
      API_URL: config.sms_apiUrl || config.LANCOLA_SMS_APIURL || process.env.LANCOLA_SMS_APIURL || '',
      API_KEY: config.sms_apiKey || config.LANCOLA_SMS_apiKey || process.env.LANCOLA_SMS_apiKey || '',
      PARTNER_ID: config.sms_partnerID || config.LANCOLA_SMS_partnerID || process.env.LANCOLA_SMS_partnerID || '',
      SHORT_CODE: config.sms_shortCode || config.LANCOLA_SMS_shortCode || process.env.LANCOLA_SMS_shortCode || '',
    };

    // Validate required fields
    if (!lancolaConfig.API_URL || !lancolaConfig.API_KEY || !lancolaConfig.PARTNER_ID || !lancolaConfig.SHORT_CODE) {
      throw new BadRequestException('Missing required SMS credentials');
    }

    const phoneNumber = phoneNumberWithCountryCode({ phoneNumber: payload.phone, countryCode: '254' });
    payload.phone = phoneNumber;
    this.logger.log(`[SMS] Normalized phone number to: ${phoneNumber}`);

    const finalURL = prepareMessage(payload, lancolaConfig);
    this.logger.log(`[SMS] Sending SMS to provider for phone: ${phoneNumber}`);

    try {
      const response = await axios.get(finalURL);
      this.logger.log(`[SMS] Provider response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(`SMS send failed: ${error.message}`);
      throw new BadRequestException(`Failed to send SMS: ${error.message}`);
    }
  }
}