import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: false })
  is_read: boolean;

  @Column({ nullable: true })
  link: string;

  @Column()
  created_at: string;
}
