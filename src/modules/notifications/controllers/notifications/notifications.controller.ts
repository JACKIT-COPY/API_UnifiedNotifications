import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { NotificationsService } from '../../services/notifications/notifications.service';
import { NotificationPayload, NotificationType } from 'src/integrations/interfaces/notifications.interface';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

class NotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString({ each: true })
  @IsNotEmpty()
  to: string | string[];

  @IsString()
  @IsNotEmpty()
  message: string;

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
  async sendNotification(@Body() payload: NotificationDto): Promise<string> {
    if (Array.isArray(payload.to)) {
      await this.notificationsService.sendNotificationToUsers(payload);
      return `Notifications of type ${payload.type} sent to multiple users`;
    } else {
      await this.notificationsService.sendNotification(payload);
      return `Notification of type ${payload.type} sent to ${payload.to}`;
    }
  }

  @Post('send-to-all')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendNotificationToAllUsers(@Body() payload: NotificationDto): Promise<string> {
    await this.notificationsService.sendNotificationToAllUsers(payload);
    return `Notifications of type ${payload.type} sent to all users`;
  }
}