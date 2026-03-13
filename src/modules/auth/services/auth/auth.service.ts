// src/modules/auth/services/auth/auth.service.ts (new)
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/schemas/user.schema';
import { Organization } from 'src/schemas/organization.schema';
import { ApiKeysService } from 'src/modules/api-keys/services/api-keys.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Uniflow system API key + base URL for sending internal notifications
  private readonly UNIFLOW_API_KEY = 'nk_597f569630e4ce3dab177f77f42bf21e1df5f6c8929b88af7c073c053bdbe7e8';
  private readonly UNIFLOW_BASE_URL = process.env.UNIFLOW_API_URL || 'https://smsapi.solby.io:8443';
  // Template IDs from the Uniflow template library
  private readonly WELCOME_EMAIL_TEMPLATE_ID = '69b3fbe5742002794bb6fe86';
  private readonly WELCOME_SMS_TEMPLATE_ID = '69b3fd0c742002794bb6fee0';
  // The org that owns the system templates
  private readonly SYSTEM_ORG_ID = '69945a3a9fc049de6a53d8dd';

  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Organization') private orgModel: Model<Organization>,
    private jwtService: JwtService,
    private apiKeysService: ApiKeysService,
  ) { }

  private getTokenExpiryTimestamp(): string {
    // Keep in sync with JwtModule signOptions.expiresIn ('1h')
    const expiresInSeconds = 60 * 60; // 1 hour
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    return expiresAt.toISOString();
  }

  async signup(payload: any): Promise<any> {
    const {
      firstName, lastName, email, password, countryCode, phoneNumber,
      companyName, sector, country, role,
      sendWelcomeEmail, sendWelcomeSms, createApiKey,
    } = payload;
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

    const userWithOrg = user.toObject() as any;
    userWithOrg.organization = org;

    const result: any = { token, user: userWithOrg, expiresAt };

    // ── Auto-create API Key (if toggled on) ──
    if (createApiKey) {
      try {
        const apiKeyResult = await this.apiKeysService.generateKey(
          org._id.toString(),
          user._id.toString(),
          { name: `${companyName} Default Key`, permissions: ['*'] },
        );
        result.apiKey = apiKeyResult.key;
        result.apiKeyPrefix = apiKeyResult.prefix;
        this.logger.log(`[SIGNUP] Auto-created API key for org ${companyName} (prefix: ${apiKeyResult.prefix})`);
      } catch (err) {
        this.logger.error(`[SIGNUP] Failed to auto-create API key: ${err.message}`);
      }
    }

    // ── Send Welcome Notifications via Uniflow API (fire-and-forget) ──
    const dashboardUrl = process.env.CLIENT_URL || 'https://app.uniflow.io';
    const fullPhone = `${countryCode}${phoneNumber}`;

    if (sendWelcomeEmail) {
      this.sendUnifowNotification('email', {
        to: email,
        subject: 'Welcome to Uniflow Notifications',
        templateId: this.WELCOME_EMAIL_TEMPLATE_ID,
        variables: { firstName, organization: companyName, dashboardUrl },
      }).catch(err => this.logger.error(`[SIGNUP] Welcome email failed: ${err.message}`));
    }

    if (sendWelcomeSms) {
      this.sendUnifowNotification('sms', {
        to: fullPhone,
        templateId: this.WELCOME_SMS_TEMPLATE_ID,
        variables: { firstName, organization: companyName, dashboardUrl },
      }).catch(err => this.logger.error(`[SIGNUP] Welcome SMS failed: ${err.message}`));
    }

    return result;
  }

  /**
   * Send a notification via Uniflow's own API using the system API key.
   */
  private async sendUnifowNotification(
    channel: 'email' | 'sms',
    payload: { to: string; subject?: string; templateId: string; variables: Record<string, string> },
  ): Promise<void> {
    const url = `${this.UNIFLOW_BASE_URL}/notifications/send`;

    // Resolve the template content with variables
    const templateUrl = `${this.UNIFLOW_BASE_URL}/templates/${payload.templateId}`;

    try {
      // Fetch the template
      const templateRes = await fetch(templateUrl, {
        method: 'GET',
        headers: {
          'x-api-key': this.UNIFLOW_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!templateRes.ok) {
        throw new Error(`Failed to fetch template: ${templateRes.statusText}`);
      }

      const template = await templateRes.json();

      // Replace variables in template content
      let content = template.content || '';
      let subject = payload.subject || template.subject || '';
      for (const [key, value] of Object.entries(payload.variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
        subject = subject.replace(regex, value);
      }

      // Build the notification request body
      const body: any = {
        type: channel,
        to: payload.to,
        message: content,
        organizationId: this.SYSTEM_ORG_ID,
        attachments: [],
      };

      if (channel === 'email') {
        body.subject = subject;
      }

      const sendRes = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': this.UNIFLOW_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        throw new Error(`Notification API error (${sendRes.status}): ${errText}`);
      }

      this.logger.log(`[UNIFLOW] Successfully sent ${channel} welcome notification to ${payload.to}`);
    } catch (error) {
      this.logger.error(`[UNIFLOW] Failed to send ${channel} notification: ${error.message}`);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).populate('organization');
    if (!user || !(await bcrypt.compare(password, user.password))) throw new BadRequestException('Invalid credentials');

    const token = this.jwtService.sign({ userId: user._id, orgId: (user.organization as any)._id || user.organization, role: user.role });
    const expiresAt = this.getTokenExpiryTimestamp();

    return { token, user, expiresAt };
  }

  // For admin creating users: similar to signup, but require admin auth
}