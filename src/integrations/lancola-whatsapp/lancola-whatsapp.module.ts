import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LancolaWhatsAppService } from './services/lancola-whatsapp/lancola-whatsapp.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [LancolaWhatsAppService],
  exports: [LancolaWhatsAppService],
})
@Global()
export class LancolaWhatsAppModule {}