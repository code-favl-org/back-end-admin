import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'favl_pilots' })
export class FavlPilot {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document: string | null;

  @Column({ name: 'document_type', type: 'enum', enum: ['dni', 'pasaporte'], nullable: true })
  documentType: string | null;

  @Column({ name: 'email_private', type: 'int', nullable: true, default: 0 })
  emailPrivate: number | null;

  @Column({ name: 'phone_private', type: 'int', nullable: true, default: 0 })
  phonePrivate: number | null;

  @Column({ name: 'emergency_contact_private', type: 'int', default: 0 })
  emergencyContactPrivate: number;

  @Column({
    name: 'emergency_contact_name',
    type: 'varchar',
    length: 80,
    default: 'n/d',
  })
  emergencyContactName: string;

  @Column({
    name: 'emergency_contact_phone',
    type: 'varchar',
    length: 20,
    default: 'n/d',
  })
  emergencyContactPhone: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  whatsapp: number | null;

  @Column({ type: 'char', length: 1, nullable: true, default: '1' })
  status: string | null;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  datein: Date;

  @Column({
    name: 'terms_and_conditions_accepted',
    type: 'char',
    length: 2,
    nullable: true,
  })
  termsAndConditionsAccepted: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
