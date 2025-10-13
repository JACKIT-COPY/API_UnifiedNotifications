import { Global, Module } from '@nestjs/common';
import { UsersController } from './controllers/users/users.controller';
import { UsersService } from './services/users/users.service';

const imports:any[] = [];
const providers:any[] = [UsersService];


@Module(
  {
    imports,
  controllers: [UsersController],
  providers,
  exports: imports.concat(providers),
})
@Global()
export class UsersModule {}
