import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LancolaSmsModule } from './integrations/lancola-sms/lancola-sms.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
     UsersModule, 
     MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService) => ({
        uri: configService.get('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
     NotificationsModule, 
      AuthModule,
     LancolaSmsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

