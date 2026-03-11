import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { SendMessageDto } from '../dto/send-message.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { ChatGateway } from '../gateways/chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationsRepository: Repository<ChatConversation>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly notificationsService: NotificationsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getConversations(userId: string, role: UserRole, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = role === UserRole.PATIENT ? { patientId: userId } : { doctorId: userId };

    const [conversations, total] = await this.conversationsRepository.findAndCount({
      where,
      order: { lastMessageTime: 'DESC' },
      skip,
      take: limit,
    });

    return { conversations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getOrCreateConversation(appointmentId: string): Promise<ChatConversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { appointmentId },
    });
    return conversation;
  }

  async createConversation(data: Partial<ChatConversation>): Promise<ChatConversation> {
    const existing = await this.conversationsRepository.findOne({
      where: { appointmentId: data.appointmentId },
    });
    if (existing) return existing;

    const conversation = this.conversationsRepository.create(data);
    return this.conversationsRepository.save(conversation);
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.patientId !== userId && conversation.doctorId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await this.messagesRepository.findAndCount({
      where: { conversationId },
      order: { timestamp: 'ASC' },
      skip,
      take: limit,
    });

    return { messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    sender: User,
  ): Promise<Message> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (
      conversation.patientId !== sender.id &&
      conversation.doctorId !== sender.id
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const recipientId =
      sender.id === conversation.patientId
        ? conversation.doctorId
        : conversation.patientId;

    const message = this.messagesRepository.create({
      conversationId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      content: dto.content,
      timestamp: new Date(),
      isRead: false,
      attachments: [],
    });
    await this.messagesRepository.save(message);

    conversation.lastMessage = dto.content;
    conversation.lastMessageTime = message.timestamp;
    conversation.unreadCount += 1;
    await this.conversationsRepository.save(conversation);

    const notification = await this.notificationsService.create({
      userId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      message: `${sender.name}: ${dto.content.substring(0, 80)}`,
      actionUrl: `/app/chat/${conversationId}`,
      metadata: { conversationId, senderId: sender.id },
    });

    this.chatGateway.emitNewMessage(recipientId, message);
    this.chatGateway.emitNotification(recipientId, notification);

    return message;
  }

  async markAllRead(
    conversationId: string,
    userId: string,
  ): Promise<{ success: boolean; markedCount: number }> {
    const result = await this.messagesRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversationId = :conversationId AND senderId != :userId AND isRead = false', {
        conversationId,
        userId,
      })
      .execute();

    await this.conversationsRepository.update({ id: conversationId }, { unreadCount: 0 });

    return { success: true, markedCount: result.affected || 0 };
  }
}
