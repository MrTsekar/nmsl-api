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

  @OneToOne(() => Doctor, (doctor) => doctor.availabilitySchedule)
  @JoinColumn()
  doctor: Doctor;

  @Column('simple-array') // Store as comma-separated: monday,tuesday,wednesday
  days: string[];

  @Column()
  useUniformTime: boolean;

  @Column({ type: 'time', nullable: true })
  uniformTimeStart: string; // Format: HH:mm

  @Column({ type: 'time', nullable: true })
  uniformTimeEnd: string; // Format: HH:mm

  @Column({ type: 'jsonb', nullable: true })
  customTimes: Record<string, { start: string; end: string }>; // { monday: { start: '09:00', end: '17:00' } }

  @UpdateDateColumn()
  updatedAt: Date;
}
