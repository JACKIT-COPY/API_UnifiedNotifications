import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
    getUsers(): any[] {
        return ['0759154322', '0702173432', '0708422044','0728504715','0748623870']
    }
}