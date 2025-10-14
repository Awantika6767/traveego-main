import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  request_id: string;

  @Column()
  actor_id: string;

  @Column()
  actor_name: string;

  @Column()
  actor_role: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  attachment_url: string;

  @Column()
  created_at: string;
}
