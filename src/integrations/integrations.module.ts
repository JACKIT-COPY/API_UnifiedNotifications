import { Module, Global } from '@nestjs/common';
import { LancolaSmsModule } from './lancola-sms/lancola-sms.module';
import { BelioSmsModule } from './belio-sms/belio-sms.module';
import { SmsProviderFactory } from './services/sms-provider-factory.service';
import { ProvidersController } from './controllers/providers.controller';

@Global()
@Module({
  imports: [LancolaSmsModule, BelioSmsModule],
  controllers: [ProvidersController],
  providers: [SmsProviderFactory],
  exports: [SmsProviderFactory],
})
export class IntegrationsModule {}
