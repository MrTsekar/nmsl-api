import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('doctor_availability')
export class DoctorAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation to Doctor entity
  @OneToOne(() => Doctor, (doctor) => doctor.availabilitySchedule)
  @JoinColumn()
  doctor: Doctor;

  // Legacy: Direct doctorId column for backward compatibility
  @Column({ type: 'uuid', nullable: true })
  doctorId: string;

  // New spec-compliant schema (time-range based)
  @Column('simple-array', { nullable: true })
  days: string[]; // Store as comma-separated: monday,tuesday,wednesday

  @Column({ default: false })
  useUniformTime: boolean;

  @Column({ type: 'time', nullable: true })
  uniformTimeStart: string; // Format: HH:mm

  @Column({ type: 'time', nullable: true })
  uniformTimeEnd: string; // Format: HH:mm

  @Column({ type: 'jsonb', nullable: true })
  customTimes: Record<string, { start: string; end: string }>; // { monday: { start: '09:00', end: '17:00' } }

  // Legacy slot-based schema (for backward compatibility - to be deprecated)
  @Column('simple-array', { nullable: true })
  availableDays: string[]; // monday,tuesday,wednesday

  @Column('simple-array', { nullable: true })
  timeSlots: string[]; // 09:00,10:00,11:00

  @Column({ type: 'jsonb', nullable: true, default: [] })
  bookedSlots: Array<{ date: string; time: string; appointmentId: string }>;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  unavailableSlots: Array<{ date: string; time: string; reason?: string }>;

  @UpdateDateColumn()
  updatedAt: Date;
}
