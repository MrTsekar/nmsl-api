import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { NotificationType } from '../entities/notification.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's notifications" })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentUser() user: User,
    @Query('isRead') isRead?: boolean,
    @Query('type') type?: NotificationType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      this.logger.log(`GET /notifications - User: ${user.id}`);
      return await this.notificationsService.findAllForUser(user.id, { isRead, type, page, limit });
    } catch (error) {
      this.logger.error(`Failed to fetch notifications: ${error.message}`, error.stack);
      // Return empty result instead of 500 error
      return {
        notifications: [],
        unreadCount: 0,
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };
    }
  }

  @Patch(':id/mark-read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Param('id') id: string, @CurrentUser() user: User) {
    try {
      this.logger.log(`PATCH /notifications/${id}/mark-read - User: ${user.id}`);
      const result = await this.notificationsService.markRead(id, user.id);
      
      if (!result) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to mark notification as read: ${error.message}`, error.stack);
      throw new HttpException('Failed to mark notification as read', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: User) {
    try {
      this.logger.log(`POST /notifications/mark-all-read - User: ${user.id}`);
      return await this.notificationsService.markAllRead(user.id);
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`, error.stack);
      throw new HttpException('Failed to mark all notifications as read', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
