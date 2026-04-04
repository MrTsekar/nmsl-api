import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('statistics')
export class Statistic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  icon: string; // 'clock' | 'building' | 'users' | 'award' | 'heart' | 'star'

  @Column()
  value: string;

  @Column()
  label: string;

  @Column({ nullable: true })
  description: string;
}
