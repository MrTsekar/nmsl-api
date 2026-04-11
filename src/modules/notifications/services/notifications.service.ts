import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = this.notificationsRepository.create(dto);
      return await this.notificationsRepository.save(notification);
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  async findAllForUser(
    userId: string,
    query: { isRead?: boolean; type?: NotificationType; page?: number; limit?: number },
  ) {
    try {
      const { isRead, type, page = 1, limit = 20 } = query;
      const skip = (page - 1) * limit;

      this.logger.log(`Fetching notifications for user ${userId}`);

      const qb = this.notificationsRepository
        .createQueryBuilder('n')
        .where('n.userId = :userId', { userId })
        .orderBy('n.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      if (isRead !== undefined) qb.andWhere('n.isRead = :isRead', { isRead });
      if (type) qb.andWhere('n.type = :type', { type });

      const [notifications, total] = await qb.getManyAndCount();
      const unreadCount = await this.notificationsRepository.count({
        where: { userId, isRead: false },
      });

      this.logger.log(`Found ${total} notifications for user ${userId}, ${unreadCount} unread`);

      return {
        notifications,
        unreadCount,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch notifications for user ${userId}: ${error.message}`,
        error.stack,
      );
      
      // Return empty result instead of throwing error
      return {
        notifications: [],
        unreadCount: 0,
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };
    }
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    try {
      const notification = await this.notificationsRepository.findOne({
        where: { id, userId },
      });
      
      if (!notification) {
        this.logger.warn(`Notification ${id} not found for user ${userId}`);
        return null;
      }
      
      notification.isRead = true;
      return await this.notificationsRepository.save(notification);
    } catch (error) {
      this.logger.error(
        `Failed to mark notification ${id} as read for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to mark notification as read');
    }
  }

  async markAllRead(userId: string): Promise<{ success: boolean; markedCount: number }> {
    try {
      const result = await this.notificationsRepository
        .createQueryBuilder()
        .update(Notification)
        .set({ isRead: true })
        .where('userId = :userId AND isRead = false', { userId })
        .execute();

      const markedCount = result.affected || 0;
      this.logger.log(`Marked ${markedCount} notifications as read for user ${userId}`);

      return { success: true, markedCount };
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to mark all notifications as read');
    }
  }
}
