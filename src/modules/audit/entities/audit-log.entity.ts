import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  RESCHEDULED = 'rescheduled',
  COMPLETED = 'completed',
}

@Entity('audit_logs')
@Index(['performedBy'])
@Index(['performedAt'])
@Index(['action'])
@Index(['appointmentId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appointmentId: string;

  @Column()
  patientName: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column()
  performedBy: string; // Email of the officer

  @Column()
  performedByName: string; // Name of the officer

  @Column({ type: 'timestamp' })
  performedAt: Date;

  @Column({ type: 'text', nullable: true })
  details: string; // Additional info like reschedule reason

  @CreateDateColumn()
  createdAt: Date;
}
