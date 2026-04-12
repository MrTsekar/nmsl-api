import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { DoctorAvailability } from './doctor-availability.entity';

@Entity('doctors')
@Index(['email'])
@Index(['specialty'])
@Index(['location'])
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string; // Hashed with bcrypt

  @Column({
    type: 'enum',
    enum: [
      'General Practice',
      'Cardiology',
      'Pediatrics',
      'Gynecology',
      'Orthopedics',
      'Dermatology',
      'Neurology',
      'Ophthalmology',
      'ENT',
      'Psychiatry',
      'Radiology',
      'Internal Medicine',
      'Dentistry',
      'Emergency Medicine',
    ],
  })
  specialty: string;

  @Column()
  location: string; // Abuja, Lagos, Benin, Kaduna, Port Harcourt, Warri

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  qualifications: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => DoctorAvailability, (availability) => availability.doctor, {
    cascade: true,
  })
  availabilitySchedule: DoctorAvailability;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
