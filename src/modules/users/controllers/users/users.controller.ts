import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from '../../services/users/users.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guards';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {

    }
    @UseGuards(JwtAuthGuard)
    @Get()
    async getAllUsers(@Request() req) {
        return this.usersService.getUsers(req.user.orgId);
    }
}
