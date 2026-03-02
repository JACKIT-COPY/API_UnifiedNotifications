import { Injectable, BadRequestException } from '@nestjs/common';
import { LancolaSmsService } from '../lancola-sms/services/lancola-sms/lancola-sms.service';
import { BelioSmsService } from '../belio-sms/services/belio-sms/belio-sms.service';
import { ISmsProvider } from '../interfaces/sms-provider.interface';
import { Organization } from '../../schemas/organization.schema';

@Injectable()
export class SmsProviderFactory {
  constructor(
    private readonly lancolaSmsService: LancolaSmsService,
    private readonly belioSmsService: BelioSmsService,
  ) {}

  getProvider(org: Organization): ISmsProvider {
    const providerType = org.smsProvider || 'lancola';

    switch (providerType.toLowerCase()) {
      case 'lancola':
        return this.lancolaSmsService;
      case 'belio':
        return this.belioSmsService;
      default:
        throw new BadRequestException(`Unsupported SMS provider: ${providerType}`);
    }
  }
}
