/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRequest } from '../http';
import { phoneNumberWithCountryCode, prepareMessage } from './lancola-sms.functions';
import { SMSInterface } from './sms.interface';

@Injectable()
export class LancolaSmsService {
  private readonly logger = new Logger(LancolaSmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSMS(payload: SMSInterface) {
    try {
      const phoneNumber = phoneNumberWithCountryCode({ phoneNumber: payload.phone, countryCode: '254' });
      payload.phone = phoneNumber;
      this.logger.log(`[SMS] Normalized phone number to: ${phoneNumber}`);
      
      const finalURL = prepareMessage(payload, this.configService);
      this.logger.log(`[SMS] Sending SMS to provider for phone: ${phoneNumber}`);
      
      const response = await getRequest(finalURL);
      this.logger.log(`[SMS] Provider response: ${JSON.stringify(response)}`);
      
      return response;
    } catch (error) {
      throw new BadRequestException(`Failed to send SMS: ${error.message}`);
    }
  }
}