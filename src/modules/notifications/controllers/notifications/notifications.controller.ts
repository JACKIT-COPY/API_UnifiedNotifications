import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { NotificationsService } from '../../services/notifications/notifications.service';
import { NotificationPayload, NotificationType } from 'src/integrations/interfaces/notification.interface';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

interface NotificationResult {
  recipient: string;
  status: 'success' | 'failed';
  error?: string;
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