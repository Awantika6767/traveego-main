import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('catalog')
export class CatalogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  destination: string;

  @Column({ nullable: true })
  supplier: string;

  @Column('double')
  default_price: number;

  @Column({ nullable: true })
  description: string;

  @Column()
  created_at: string;
}
