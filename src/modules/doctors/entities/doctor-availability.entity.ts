import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export class BookedSlot {
  date: string;
  time: string;
  appointmentId: string;
}

export class UnavailableSlot {
  date: string;
  time: string;
  reason?: string;
}

@Entity('doctor_availability')
export class DoctorAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  doctorId: string;

  @Column('simple-array')
  availableDays: string[];

  @Column('simple-array')
  timeSlots: string[];

  @Column({ type: 'jsonb', default: [] })
  bookedSlots: BookedSlot[];

  @Column({ type: 'jsonb', default: [] })
  unavailableSlots: UnavailableSlot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'doctorId' })
  doctor: User;
}
