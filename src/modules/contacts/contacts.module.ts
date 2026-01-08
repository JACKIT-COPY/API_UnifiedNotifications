import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsController } from './controllers/contacts/contacts.controller';
import { ContactsService } from './services/contacts/contacts.service';
import { ContactSchema } from 'src/schemas/contact.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Contact', schema: ContactSchema }])],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}