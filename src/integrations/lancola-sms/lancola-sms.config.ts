import { ConfigService } from '@nestjs/config';

export const getLancolaSmsConfig = (configService: ConfigService) => ({
  API_URL: configService.get('LANCOLA_SMS_APIURL', 'https://sms.lancolatech.com/api/services/sendsms/?apikey='),
  API_KEY: configService.get('LANCOLA_SMS_apiKey', '0b945c04c2269802975acbab57c91eb6'),
  PARTNER_ID: configService.get('LANCOLA_SMS_partnerID', '8029'),
  SHORT_CODE: configService.get('LANCOLA_SMS_shortCode', 'Maziwa Tele'),
});