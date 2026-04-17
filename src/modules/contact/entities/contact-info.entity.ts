import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contact_info')
export class ContactInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  emailPrimary: string;

  @Column({ nullable: true })
  emailSecondary: string;

  @Column({ nullable: true })
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  officeHours: string;

  @Column({ nullable: true })
  emergencyHours: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
