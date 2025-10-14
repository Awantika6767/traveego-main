import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoice_number: string;

  @Column()
  quotation_id: string;

  @Column()
  request_id: string;

  @Column()
  client_name: string;

  @Column()
  client_email: string;

  @Column('double')
  total_amount: number;

  @Column('double')
  advance_amount: number;

  @Column({ nullable: true })
  gst_number: string;

  @Column('simple-json')
  bank_details: Record<string, string>;

  @Column({ nullable: true })
  upi_id: string;

  @Column()
  due_date: string;

  @Column()
  created_at: string;
}
