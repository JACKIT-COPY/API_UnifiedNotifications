// src/modules/auth/services/auth/auth.service.ts (new)
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/schemas/user.schema';
import { Organization } from 'src/schemas/organization.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Organization') private orgModel: Model<Organization>,
    private jwtService: JwtService,
  ) { }

  private getTokenExpiryTimestamp(): string {
    // Keep in sync with JwtModule signOptions.expiresIn ('1h')
    const expiresInSeconds = 60 * 60; // 1 hour
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    return expiresAt.toISOString();
  }

  async signup(payload: any): Promise<any> {
    const { firstName, lastName, email, password, countryCode, phoneNumber, companyName, sector, country, role } = payload;
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new BadRequestException('Email exists');

    const org = new this.orgModel({ name: companyName, sector, country });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      firstName, lastName, email, password: hashedPassword, countryCode, phoneNumber, role: role || 'admin', organization: org._id,
    });
    await org.save();
    await user.save();

    const token = this.jwtService.sign({ userId: user._id, orgId: org._id, role: user.role });
    const expiresAt = this.getTokenExpiryTimestamp();

    return { token, user, expiresAt };
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) throw new BadRequestException('Invalid credentials');

    const token = this.jwtService.sign({ userId: user._id, orgId: user.organization, role: user.role });
    const expiresAt = this.getTokenExpiryTimestamp();

    return { token, user, expiresAt };
  }

  // For admin creating users: similar to signup, but require admin auth
}