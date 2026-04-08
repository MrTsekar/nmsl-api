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

  @Column()
  phone: string;

  @Column()
  emailPrimary: string;

  @Column({ nullable: true })
  emailSecondary: string;

  @Column()
  addressLine1: string;

  @Column()
  addressLine2: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column()
  officeHours: string;

  @Column()
  emergencyHours: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
