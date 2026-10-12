import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'favl_new_pilots' })
export class FavlNewPilot {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document: string | null;

  @Column({ name: 'document_type', type: 'enum', enum: ['dni', 'pasaporte'], nullable: true })
  documentType: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 50, nullable: true })
  lastName: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 50, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 100 })
  photo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  state: string | null;

  @Column({ name: 'postal_code', type: 'varchar', length: 10, nullable: true })
  postalCode: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  country: string | null;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ name: 'email_private', type: 'int', nullable: true, default: 0 })
  emailPrivate: number | null;

  @Column({ name: 'phone_private', type: 'int', nullable: true, default: 0 })
  phonePrivate: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'mobile_phone', type: 'varchar', length: 20, nullable: true })
  mobilePhone: string | null;

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

  @Column({ type: 'char', length: 2, nullable: true, default: '1' })
  gender: string | null;

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
