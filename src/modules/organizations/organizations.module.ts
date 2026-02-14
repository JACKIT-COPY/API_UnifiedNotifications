// src/modules/organizations/organizations.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationsController } from './controllers/organizations/organizations.controller';
import { OrganizationsService } from './services/organizations/organizations.service';
import { OrganizationSchema } from 'src/schemas/organization.schema';
import { UserSchema } from 'src/schemas/user.schema';
import { ContactSchema } from 'src/schemas/contact.schema';
import { GroupSchema } from 'src/schemas/group.schema';
import { MessageLogSchema } from 'src/schemas/message-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Organization', schema: OrganizationSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Contact', schema: ContactSchema },
      { name: 'Group', schema: GroupSchema },
      { name: 'MessageLog', schema: MessageLogSchema },
    ])
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],  // So other services can use getById
})
export class OrganizationsModule {}