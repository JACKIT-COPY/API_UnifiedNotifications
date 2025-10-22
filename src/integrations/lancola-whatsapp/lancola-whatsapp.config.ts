import { ConfigService } from '@nestjs/config';

export const getLancolaWhatsAppConfig = (configService: ConfigService) => ({
  ACCESS_TOKEN: configService.get('WHATSAPP_ACCESS_TOKEN', ''),
  PHONE_NUMBER_ID: configService.get('WHATSAPP_PHONE_NUMBER_ID', ''),
  API_VERSION: configService.get('WHATSAPP_API_VERSION', 'v18.0'),
});