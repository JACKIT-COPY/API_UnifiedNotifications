import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guards';
import { ContactsService } from '../../services/contacts/contacts.service';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Post('')
  async createContact(@Body() payload: any, @Request() req) {
    return this.contactsService.createContact(payload, req.user.orgId);
  }

  @Get('')
  async getContacts(@Request() req) {
    return this.contactsService.getContacts(req.user.orgId);
  }

  @Put(':id')
  async updateContact(@Param('id') id: string, @Body() payload: any, @Request() req) {
    return this.contactsService.updateContact(id, payload, req.user.orgId);
  }

  @Delete(':id')
  async deleteContact(@Param('id') id: string, @Request() req) {
    return this.contactsService.deleteContact(id, req.user.orgId);
  }
}