import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'favl_clubs' })
export class FavlClub {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'no.jpg' })
  logo: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  name: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 150, nullable: true })
  fullName: string | null;

  @Column({
    name: 'tax_id',
    type: 'varchar',
    length: 11,
    nullable: true,
    default: '0',
  })
  taxId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  website: string | null;

  @Column({ type: 'boolean', nullable: true })
  active: boolean | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  state: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  longitude: string | null;

  @Column({ name: 'legal_id', type: 'varchar', length: 85, nullable: true })
  legalId: string | null;

  @Column({ name: 'legal_status', type: 'varchar', length: 20, nullable: true })
  legalStatus: string | null;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'varchar', length: 250 })
  comments: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
