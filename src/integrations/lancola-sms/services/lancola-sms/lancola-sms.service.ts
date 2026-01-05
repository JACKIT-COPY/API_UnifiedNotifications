/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRequest } from '../http';
import { phoneNumberWithCountryCode, prepareMessage } from './lancola-sms.functions';
import { SMSInterface } from './sms.interface';

@Injectable()
export class LancolaSmsService {
  constructor(private readonly configService: ConfigService) {}

  async sendSMS(payload: SMSInterface) {
    try {
      const phoneNumber = phoneNumberWithCountryCode({ phoneNumber: payload.phone, countryCode: '254' });
      payload.phone = phoneNumber;
      const finalURL = prepareMessage(payload, this.configService);
      const response = await getRequest(finalURL);
      return response;
    } catch (error) {
      throw new BadRequestException(`Failed to send SMS: ${error.message}`);
    }
  }
}