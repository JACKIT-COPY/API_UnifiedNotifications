import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LancolaEmailService } from './services/lancola-email/lancola-email.service';
import { OrganizationsModule } from 'src/modules/organizations/organizations.module';

@Module({
  imports: [
    ConfigModule, OrganizationsModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('EMAIL_HOST', 'smtp.gmail.com'),
          port: configService.get('EMAIL_PORT', 587),
          secure: false, // Use TLS
          auth: {
            user: configService.get('EMAIL_USER'),
            pass: configService.get('EMAIL_PASS'),
          },
        },
        defaults: {
          from: '"Unified API" <no-reply@yourdomain.com>',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [LancolaEmailService],
  exports: [LancolaEmailService],
})
export class LancolaEmailModule {}