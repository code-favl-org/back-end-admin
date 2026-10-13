import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity({ name: 'auth_sessions' })
@Index('IDX_auth_sessions_user_id', ['userId'])
export class AuthSession {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @Column({ name: 'token_hash', type: 'char', length: 64, unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp', precision: 3 })
  expiresAt: Date;

  @Column({ name: 'refresh_token_hash', type: 'char', length: 64, unique: true, nullable: true })
  refreshTokenHash: string | null;

  @Column({ name: 'refresh_expires_at', type: 'timestamp', precision: 3, nullable: true })
  refreshExpiresAt: Date | null;

  @Column({ name: 'absolute_expires_at', type: 'timestamp', precision: 3 })
  absoluteExpiresAt: Date;

  @Column({ name: 'last_used_at', type: 'timestamp', precision: 3, nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamp', precision: 3, nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;
}