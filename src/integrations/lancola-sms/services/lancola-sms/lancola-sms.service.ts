// src/integrations/lancola-sms/services/lancola-sms/lancola-sms.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';
import { phoneNumberWithCountryCode, prepareMessage, LancolaSmsConfig } from './lancola-sms.functions';
import { SMSInterface } from './sms.interface';


@Injectable()
export class LancolaSmsService {
  private readonly logger = new Logger(LancolaSmsService.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  async sendSMS(payload: SMSInterface, orgId: string) {
    const org = await this.organizationsService.getById(orgId);
    const creds = org.credentials || {};

    // Build effective config: org first, .env fallback
    const config: LancolaSmsConfig = {
      API_URL: creds.sms_apiUrl || process.env.LANCOLA_SMS_APIURL || '',
      API_KEY: creds.sms_apiKey || process.env.LANCOLA_SMS_apiKey || '',
      PARTNER_ID: creds.sms_partnerID || process.env.LANCOLA_SMS_partnerID || '',
      SHORT_CODE: creds.sms_shortCode || process.env.LANCOLA_SMS_shortCode || '',
    };

    // Validate required fields
    if (!config.API_URL || !config.API_KEY || !config.PARTNER_ID || !config.SHORT_CODE) {
      throw new BadRequestException('Missing required SMS credentials');
    }

    const phoneNumber = phoneNumberWithCountryCode({ phoneNumber: payload.phone, countryCode: '254' });
    payload.phone = phoneNumber;
    this.logger.log(`[SMS] Normalized phone number to: ${phoneNumber}`);

    const finalURL = prepareMessage(payload, config);
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