import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TestimonialCategory {
  STAFF = 'staff',
  DEPENDENT = 'dependent',
  PATIENT = 'patient',
}

export enum ServiceType {
  PHYSICAL_APPOINTMENT = 'physical_appointment',
  TELEMEDICINE = 'telemedicine',
  LABORATORY = 'laboratory',
  PHARMACY = 'pharmacy',
}

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  patientName: string;

  @Column({
    type: 'enum',
    enum: TestimonialCategory,
    default: TestimonialCategory.PATIENT,
  })
  category: TestimonialCategory;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.PHYSICAL_APPOINTMENT,
  })
  serviceType: ServiceType;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
