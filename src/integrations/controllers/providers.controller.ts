import { Controller, Get, UseGuards } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport'; // Assumed auth guard exists
// import { RolesGuard } from '../../modules/auth/guards/roles.guard'; // Assumed roles guard
// import { Roles } from '../../modules/auth/decorators/roles.decorator';

@Controller('api/admin/sms-providers')
export class ProvidersController {
  @Get()
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('admin')
  getAvailableProviders() {
    return [
      {
        id: 'lancola',
        name: 'Lancola SMS',
        description: 'Default SMS provider using API key and Partner ID.',
        fields: [
          { key: 'sms_apiUrl', label: 'API URL', type: 'text', placeholder: 'https://sms.lancolatech.com/api/services/sendsms/?apikey=' },
          { key: 'sms_apiKey', label: 'API Key', type: 'text', placeholder: 'dde2efa9e40d31eae58cd7b1f89c139e' },
          { key: 'sms_partnerID', label: 'Partner ID', type: 'text', placeholder: '8029' },
          { key: 'sms_shortCode', label: 'Short Code', type: 'text', placeholder: 'Maziwa Tele' },
        ],
      },
      {
        id: 'belio',
        name: 'Belio SMS',
        description: 'Advanced SMS provider using OAuth2 Client Credentials.',
        fields: [
          { key: 'belio_clientId', label: 'Client ID', type: 'text', placeholder: 'Your Belio Client ID' },
          { key: 'belio_clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Your Belio Client Secret' },
          { key: 'belio_serviceId', label: 'Service ID', type: 'text', placeholder: 'Your Belio Service ID' },
        ],
      },
    ];
  }
}
