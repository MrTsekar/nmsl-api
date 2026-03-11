import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum MedicalResultStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

@Entity('medical_results')
export class MedicalResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column()
  appointmentId: string;

  @Column()
  testName: string;

  @Column({ type: 'date' })
  testDate: string;

  @Column({ type: 'date' })
  resultDate: string;

  @Column()
  labName: string;

  @Column({
    type: 'enum',
    enum: MedicalResultStatus,
    default: MedicalResultStatus.PENDING,
  })
  status: MedicalResultStatus;

  @Column()
  fileUrl: string;

  @Column()
  fileType: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
