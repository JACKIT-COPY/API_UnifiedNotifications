import { Injectable } from '@nestjs/common';

interface User {
  phone: string;
  email: string;
}

@Injectable()
export class UsersService {
  getUsers(): User[] {
    return [
      { phone: '0759154322', email: 'user1@example.com' },
      { phone: '0702173432', email: 'user2@example.com' },
      { phone: '0708422044', email: 'user3@example.com' },
      { phone: '0728504715', email: 'user4@example.com' },
      { phone: '0748623870', email: 'user5@example.com' },
    ];
  }
}