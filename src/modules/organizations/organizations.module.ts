// src/modules/organizations/organizations.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationsController } from './controllers/organizations/organizations.controller';
import { OrganizationsService } from './services/organizations/organizations.service';
import { OrganizationSchema } from 'src/schemas/organization.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Organization', schema: OrganizationSchema }])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],  // So other services can use getById
})
export class OrganizationsModule {}