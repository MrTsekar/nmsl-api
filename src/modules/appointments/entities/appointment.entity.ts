import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  RESCHEDULED = 'rescheduled',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  NO_SHOW = 'no-show',
  CANCELLED = 'cancelled',
}

export class Prescription {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

@Entity('appointments')
@Index(['patientId'])
@Index(['doctorId'])
@Index(['appointmentDate'])
@Index(['status'])
@Index(['isConflicted'])
@Index(['lockedBy'])
@Index(['lockedAt'])
@Index(['doctorId', 'appointmentDate'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  patientId: string;

  @Column({ nullable: true })
  doctorId: string;

  @Column()
  patientName: string;

  @Column({ nullable: true })
  doctorName: string;

  @Column({ type: 'date' })
  appointmentDate: string;

  @Column()
  appointmentTime: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  prescriptions: Prescription[];

  @Column()
  specialty: string;

  @Column()
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  fee: number;

  @Column({ default: false })
  isConflicted: boolean;

  @Column({ nullable: true })
  visitType: string; // 'Physical' | 'Telemedicine'

  @Column({ type: 'text', nullable: true })
  rescheduleReason: string;

  // Additional fields from spec
  @Column({ nullable: true })
  patientEmail: string;

  @Column({ nullable: true })
  patientPhone: string;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ type: 'text', nullable: true })
  additionalComment: string;

  // LOCKING FIELDS - CRITICAL FOR APPOINTMENT OFFICER WORKFLOW
  @Column({ nullable: true })
  lockedBy: string; // Email of the officer who locked it

  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date;

  @Column({ nullable: true })
  originalAppointmentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @ManyToOne(() => Doctor, { eager: false, nullable: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  // Virtual property for API compatibility - maps 'reason' to 'reasonForVisit'
  get reasonForVisit(): string {
    return this.reason;
  }

  set reasonForVisit(value: string) {
    this.reason = value;
  }
}
