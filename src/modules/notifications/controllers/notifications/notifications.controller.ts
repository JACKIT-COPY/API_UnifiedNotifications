// src/modules/notifications/controllers/notifications/notifications.controller.ts
import { Body, Controller, Post, UsePipes, ValidationPipe, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from '../../services/notifications/notifications.service';
import { NotificationPayload, NotificationType } from 'src/integrations/interfaces/notification.interface';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CombinedAuthGuard } from 'src/modules/auth/guards/combined-auth.guard';

class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  contentType?: string;
}

class NotificationDto implements NotificationPayload {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString({ each: true })
  @IsNotEmpty()
  to: string | string[];

  @ValidateIf(o => o.type === NotificationType.SMS || o.type === NotificationType.EMAIL)
  @IsString()
  @IsNotEmpty()
  message?: string;

  @ValidateIf(o => o.type === NotificationType.EMAIL)
  @IsString()
  @IsNotEmpty()
  subject?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  data?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsOptional()
  @Type(() => Date)
  scheduledAt?: Date;
}

interface NotificationResult {
  recipient: string;
  status: 'success' | 'failed';
  error?: string;
}

@Controller('notifications')
@UseGuards(CombinedAuthGuard)  // Accepts both JWT tokens and API keys
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post('send')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendNotification(@Body() payload: NotificationDto, @Request() req): Promise<NotificationResult | NotificationResult[]> {
    const orgId = req.user.orgId;
    const userId = req.user.userId;

    if (Array.isArray(payload.to)) {
      return this.notificationsService.sendNotificationToUsers(payload, orgId, userId);
    } else {
      await this.notificationsService.sendNotification(payload, orgId, userId);
      return { recipient: payload.to, status: 'success' };
    }
  }

  @Post('send-to-all')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendNotificationToAllUsers(@Body() payload: NotificationDto, @Request() req): Promise<NotificationResult[]> {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    return this.notificationsService.sendNotificationToAllUsers(payload, orgId, userId);
  }

  @Post('send-now')
  async sendNow(@Body('logId') logId: string, @Request() req) {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    return this.notificationsService.sendNow(logId, orgId, userId);
  }
}