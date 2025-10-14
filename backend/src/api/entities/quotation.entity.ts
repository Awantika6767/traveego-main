import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { QuotationStatus } from '../enums';

@Entity('quotations')
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  request_id: string;

  @Column('simple-json')
  versions: any[];

  @Column({ default: QuotationStatus.DRAFT })
  status: QuotationStatus;

  @Column({ nullable: true })
  expiry_date: string;

  @Column({ nullable: true })
  published_at: string;

  @Column('double', { default: 30.0 })
  advance_percent: number;

  @Column('double', { default: 0.0 })
  advance_amount: number;

  @Column('double', { default: 0.0 })
  grand_total: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;
}
