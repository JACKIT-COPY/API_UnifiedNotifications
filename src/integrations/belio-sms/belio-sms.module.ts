import { Module } from '@nestjs/common';
import { BelioSmsService } from './services/belio-sms/belio-sms.service';
import { OrganizationsModule } from '../../modules/organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  providers: [BelioSmsService],
  exports: [BelioSmsService],
})
export class BelioSmsModule {}
