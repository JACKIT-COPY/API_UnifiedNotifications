// src/modules/usage/usage.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsageController } from './controllers/usage/usage.controller';
import { UsageService } from './services/usage/usage.service';
import { MessageLogSchema, MessageLog } from 'src/schemas/message-log.schema';
import { OrganizationSchema } from 'src/schemas/organization.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'MessageLog', schema: MessageLogSchema }, // Use the string name 'MessageLog' to match existing if not using class name consistently
            // Or better, check how it's registered elsewhere. In MessageLogsModule it uses 'MessageLog'.
            { name: 'Organization', schema: OrganizationSchema },
        ]),
    ],
    controllers: [UsageController],
    providers: [UsageService],
    exports: [UsageService],
})
export class UsageModule { }
