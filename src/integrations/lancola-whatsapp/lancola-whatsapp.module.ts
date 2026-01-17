import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LancolaWhatsAppService } from './services/lancola-whatsapp/lancola-whatsapp.service';
import { OrganizationsModule } from 'src/modules/organizations/organizations.module';

@Module({
  imports: [ConfigModule, HttpModule, OrganizationsModule],
  providers: [LancolaWhatsAppService],
  exports: [LancolaWhatsAppService],
})
@Global()
export class LancolaWhatsAppModule {}