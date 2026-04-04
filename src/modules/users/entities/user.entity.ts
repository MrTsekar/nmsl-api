import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  APPOINTMENT_OFFICER = 'appointment_officer',
}

export enum MedicalSpecialty {
  GENERAL_PRACTICE = 'General Practice',
  CARDIOLOGY = 'Cardiology',
  DERMATOLOGY = 'Dermatology',
  PEDIATRICS = 'Pediatrics',
  ORTHOPEDICS = 'Orthopedics',
  NEUROLOGY = 'Neurology',
  GYNECOLOGY = 'Gynecology',
  PSYCHIATRY = 'Psychiatry',
  OPHTHALMOLOGY = 'Ophthalmology',
  DENTISTRY = 'Dentistry',
}

@Entity('users')
@Index(['email'])
@Index(['role'])
@Index(['specialty'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  @Column()
  phone: string;

  @Column()
  location: string;

  @Column()
  state: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: MedicalSpecialty,
    nullable: true,
  })
  specialty: MedicalSpecialty;

  @Column({ nullable: true })
  qualifications: string;

  @Column({ type: 'int', nullable: true })
  yearsOfExperience: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  consultationFee: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, default: 0 })
  rating: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  gender: string; // 'male' | 'female' | 'other'

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordToken: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  resetPasswordExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
