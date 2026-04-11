import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ServiceCategory {
  EMERGENCY_SERVICES = 'Emergency Services',
  SPECIALIZED_CARE = 'Specialized Care',
  DENTAL_CARE = 'Dental Care',
  PRIMARY_CARE = 'Primary Care',
  SURGICAL_SERVICES = 'Surgical Services',
  DIAGNOSTIC_SERVICES = 'Diagnostic Services',
  WOMENS_HEALTH = "Women's Health",
  PEDIATRIC_CARE = 'Pediatric Care',
  MENTAL_HEALTH = 'Mental Health',
  REHABILITATION = 'Rehabilitation',
}

export enum NigeriaLocation {
  ABUJA = 'Abuja',
  LAGOS = 'Lagos',
  BENIN = 'Benin',
  KADUNA = 'Kaduna',
  PORT_HARCOURT = 'Port Harcourt',
  WARRI = 'Warri',
}

export interface KeyServiceItem {
  title: string;
  description: string;
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ServiceCategory,
  })
  category: ServiceCategory;

  @Column({
    type: 'enum',
    enum: NigeriaLocation,
  })
  location: NigeriaLocation;

  @Column({ type: 'text' })
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  fullDescription: string;

  @Column({ type: 'text', nullable: true })
  bannerImageUrl: string;

  @Column({ type: 'text', nullable: true })
  iconImageUrl: string;

  @Column({ type: 'jsonb', default: [] })
  keyServices: KeyServiceItem[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
