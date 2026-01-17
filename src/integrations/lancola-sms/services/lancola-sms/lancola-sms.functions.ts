/* eslint-disable prettier/prettier */
import { ConfigService } from '@nestjs/config';
import { getLancolaSmsConfig } from '../../lancola-sms.config';
import { SMSInterface } from './sms.interface';

// src/integrations/lancola-sms/services/lancola-sms/lancola-sms.functions.ts
export interface LancolaSmsConfig {
  API_URL: string;
  API_KEY: string;
  PARTNER_ID: string;
  SHORT_CODE: string;
}

export function prepareMessage(payload: SMSInterface, config: LancolaSmsConfig): string {
  const { phone, message } = payload;
  const preparedMessage = `${config.API_URL}${config.API_KEY}&partnerID=${encodeURIComponent(config.PARTNER_ID)}&message=${encodeURIComponent(message)}&shortcode=${encodeURIComponent(config.SHORT_CODE)}&mobile=${phone}`;
  return preparedMessage;
}

/**
 * Formats a phone number with a country code.
 *
 * @param payload - An object containing the phone number and country code.
 * @param payload.phoneNumber - The phone number to format.
 * @param payload.countryCode - The country code to use.
 * @returns The formatted phone number with the country code.
 */
export function phoneNumberWithCountryCode(payload: {
  phoneNumber: string;
  countryCode: string;
}): string {
  const { phoneNumber, countryCode } = payload;
  return formatPhoneNumber({ phone: phoneNumber, countryCode });
}

function formatPhoneNumber(payload: { phone: string, countryCode: string }): string {
  const { phone, countryCode } = payload;
  let code = countryCode;
  if (code.startsWith('+')) {
    code = code.replace('+', '');
  }

  let mobile: string = phone.toString().replace(/\s+/g, ''); // Remove spaces

  if (mobile.startsWith('0')) {
    mobile = `${code}${mobile.slice(1)}`;
  } else if (mobile.startsWith('+')) {
    mobile = mobile.replace('+', '');
  } else {
    mobile = `${code}${mobile}`;
  }
  return mobile;
}