import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PatientCategory {
  STAFF = 'Staff',
  RETIREE = 'Retiree',
  DEPENDENT = 'Dependent',
}

export enum ServiceType {
  PHYSICAL_APPOINTMENT = 'Physical Appointment',
  TELEMEDICINE = 'Telemedicine',
}

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  patientName: string;

  @Column({
    type: 'enum',
    enum: PatientCategory,
  })
  patientCategory: PatientCategory;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: ServiceType,
  })
  serviceType: ServiceType;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
