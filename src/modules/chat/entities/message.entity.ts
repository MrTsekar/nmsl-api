import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ChatConversation } from './conversation.entity';
import { User } from '../../users/entities/user.entity';

export class MessageAttachment {
  url: string;
  type: 'image' | 'pdf' | 'file';
  name: string;
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column()
  senderId: string;

  @Column()
  senderName: string;

  @Column()
  senderRole: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  attachments: MessageAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ChatConversation, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversationId' })
  conversation: ChatConversation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;
}
