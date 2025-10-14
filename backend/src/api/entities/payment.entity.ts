import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentStatus } from '../enums';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoice_id: string;

  @Column('double')
  amount: number;

  @Column()
  method: string;

  @Column({ default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  received_at: string;

  @Column({ nullable: true })
  verified_at: string;

  @Column({ nullable: true })
  accountant_notes: string;

  @Column({ nullable: true })
  ops_notes: string;

  @Column({ nullable: true })
  proof_url: string;

  @Column()
  created_at: string;
}
