import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { RequestStatus } from '../enums';

@Entity('requests')
export class TravelRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  client_name: string;

  @Column()
  client_email: string;

  @Column()
  client_phone: string;

  @Column()
  title: string;

  @Column('int')
  people_count: number;

  @Column('double')
  budget_min: number;

  @Column('double')
  budget_max: number;

  @Column('simple-json')
  travel_vibe: string[];

  @Column({ nullable: true })
  preferred_dates: string;

  @Column({ nullable: true })
  destination: string;

  @Column({ nullable: true })
  special_requirements: string;

  @Column({ default: RequestStatus.PENDING })
  status: RequestStatus;

  @Column({ nullable: true })
  assigned_salesperson_id: string;

  @Column({ nullable: true })
  assigned_salesperson_name: string;

  @Column()
  created_by: string;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column({ nullable: true })
  next_follow_up: string;

  @Column({ nullable: true })
  sla_timer: string;
}
