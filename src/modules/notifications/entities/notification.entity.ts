import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  // Security & Account
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_CHANGED = 'email_changed',
  ACCOUNT_SECURITY = 'account_security',
  
  // Medical (Critical for patients)
  NEW_PRESCRIPTION = 'new_prescription',
  NEW_RESULT = 'new_result',
  
  // Content Management (for admins)
  SERVICE_ADDED = 'service_added',
  SERVICE_UPDATED = 'service_updated',
  SERVICE_DELETED = 'service_deleted',
  BOARD_MEMBER_ADDED = 'board_member_added',
  BOARD_MEMBER_REMOVED = 'board_member_removed',
  
  // Website Interactions
  CONTACT_FORM_SUBMITTED = 'contact_form_submitted',
  NEW_MESSAGE = 'new_message',
}

@Entity('notifications')
@Index(['userId'])
@Index(['isRead'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
