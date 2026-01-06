// src/modules/auth/controllers/auth/auth.controller.ts (new)
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../../services/auth/auth.service';
// import { JwtAuthGuard } from '../../guards/jwt.guard';  // Create later

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() payload: any) {
    return this.authService.signup(payload);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // Admin create user: @UseGuards(JwtAuthGuard, AdminGuard) @Post('users')
}