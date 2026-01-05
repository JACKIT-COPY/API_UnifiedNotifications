import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { NotificationsService } from '../../services/notifications/notifications.service';
import { NotificationPayload, NotificationType } from 'src/integrations/interfaces/notification.interface';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

  @ValidateIf(o => o.type === NotificationType.EMAIL)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

interface NotificationResult {
  recipient: string;
  status: 'success' | 'failed';
  error?: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendNotification(@Body() payload: NotificationDto): Promise<NotificationResult | NotificationResult[]> {
    if (Array.isArray(payload.to)) {
      return this.notificationsService.sendNotificationToUsers(payload);
    } else {
      await this.notificationsService.sendNotification(payload);
      return { recipient: payload.to, status: 'success' };
    }
  }

  @Post('send-to-all')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendNotificationToAllUsers(@Body() payload: NotificationDto): Promise<NotificationResult[]> {
    return this.notificationsService.sendNotificationToAllUsers(payload);
  }
}