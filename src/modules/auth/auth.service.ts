import { createHash, randomBytes, randomUUID } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcryptjs';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import { AuthUser } from '../../common/types';
import { AppConfig, InjectConfig } from '../../config';
import { isRole, Role } from '../../common/types/role';
import { User } from '../users/entities/user.entity';
import { AuthSession } from './entities/auth-session.entity';

const MINUTE_MS = 60 * 1000;

/** Claims de los JWT: los MISMOS que emite back-end-public (HS256, issuer/audience `favl-api`). */
interface SessionJwtClaims {
  sub: string;
  sid: number;
  typ: 'access' | 'refresh';
  jti: string;
  dev?: boolean;
  abs?: number;
  role?: string;
  usuario?: string;
  email?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  user: AuthUser;
}

export class AccessTokenExpiredException extends UnauthorizedException {
  constructor() {
    super('Access token expirado.');
    this.name = 'AccessTokenExpiredException';
  }
}

/**
 * Login contra la tabla `users` y sesiones en `auth_sessions` (la misma base y el mismo
 * esquema de tokens que back-end-public): access JWT corto + refresh JWT que rota,
 * con tope absoluto de sesión y revocación al cerrar sesión.
 */
@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly revokedSessions = new Map<number, number>();
  private readonly logger = new Logger(AuthService.name);
  private expirySweep?: NodeJS.Timeout;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuthSession) private readonly sessions: Repository<AuthSession>,
    private readonly jwt: JwtService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.auth.devLoginBypass) {
      this.logger.warn('Bypass de login activo: solo desarrollo, sin persistencia de sesiones.');
      return;
    }

    await this.markExpiredSessions();

    const revoked = await this.sessions.find({
      select: ['id', 'absoluteExpiresAt'],
      where: { revokedAt: Not(IsNull()), absoluteExpiresAt: MoreThan(new Date()) },
    });
    for (const s of revoked) this.revokedSessions.set(s.id, s.absoluteExpiresAt.getTime());

    this.expirySweep = setInterval(() => {
      this.markExpiredSessions().catch((error: unknown) =>
        this.logger.error('No se pudieron marcar las sesiones vencidas.', error instanceof Error ? error.stack : undefined),
      );
    }, MINUTE_MS);
    this.expirySweep.unref();
  }

  onModuleDestroy(): void {
    if (this.expirySweep) clearInterval(this.expirySweep);
  }

  /**
   * Valida usuario + contraseña y abre una sesión.
   * @throws UnauthorizedException credenciales inválidas o usuario inactivo.
   * @throws ForbiddenException    el rol guardado no es uno de los roles válidos.
   */
  async login(usuario: string, password: string): Promise<AuthTokens> {
    if (this.config.auth.devLoginBypass) {
      const now = new Date();
      const absoluteExpiresAt = new Date(now.getTime() + this.config.auth.absoluteSessionTtlMs);
      return this.createTokenPair(this.developmentUser(), 0, absoluteExpiresAt);
    }

    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.usuario = :usuario', { usuario: usuario ?? '' })
      .andWhere('user.activo = :activo', { activo: true })
      .getOne();

    if (!user || !password || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Usuario o contraseña inválidos.');
    }
    if (!isRole(user.role)) {
      throw new ForbiddenException('Tu usuario no tiene acceso al backoffice.');
    }

    const now = new Date();
    const absoluteExpiresAt = new Date(now.getTime() + this.config.auth.absoluteSessionTtlMs);

    return this.sessions.manager.transaction(async (manager) => {
      const repo = manager.getRepository(AuthSession);
      const placeholder = randomBytes(32).toString('base64url');

      const session = await repo.save(
        repo.create({
          userId: user.id,
          tokenHash: this.hashToken(placeholder),
          expiresAt: absoluteExpiresAt,
          refreshTokenHash: this.hashToken(`${placeholder}:refresh`),
          refreshExpiresAt: this.expiryAfter(this.config.auth.refreshTokenTtlMs, absoluteExpiresAt),
          absoluteExpiresAt,
          lastUsedAt: now,
        }),
      );

      const tokens = await this.createTokenPair(user, session.id, absoluteExpiresAt);

      const result = await repo.update(session.id, {
        tokenHash: this.hashToken(tokens.accessToken),
        expiresAt: tokens.accessExpiresAt,
        refreshTokenHash: this.hashToken(tokens.refreshToken),
        refreshExpiresAt: tokens.refreshExpiresAt,
      });
      if (result.affected !== 1) throw new Error('No se pudo guardar la sesión.');

      return tokens;
    });
  }

  /** Canjea un refresh token por un par nuevo (el viejo queda inválido: se detecta la reutilización). */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const claims = await this.verifyToken(refreshToken, 'refresh');
    if (this.config.auth.devLoginBypass && claims.dev === true && claims.sid === 0 && claims.sub === '0') {
      const absoluteExpiry = claims.abs;
      if (typeof absoluteExpiry !== 'number' || !Number.isSafeInteger(absoluteExpiry) || absoluteExpiry <= Date.now()) {
        throw new UnauthorizedException('Refresh token expirado, revocado o reutilizado.');
      }
      return this.createTokenPair(this.developmentUser(), 0, new Date(absoluteExpiry));
    }

    const now = new Date();
    const currentHash = this.hashToken(refreshToken);

    const session = await this.sessions.findOne({
      where: {
        id: claims.sid,
        userId: Number(claims.sub),
        refreshTokenHash: currentHash,
        refreshExpiresAt: MoreThan(now),
        absoluteExpiresAt: MoreThan(now),
        revokedAt: IsNull(),
      },
    });
    if (!session?.absoluteExpiresAt) {
      throw new UnauthorizedException('Refresh token expirado, revocado o reutilizado.');
    }

    // Se relee el usuario: si lo dieron de baja o ya no tiene acceso, la sesión se revoca.
    const user = await this.users.findOne({ where: { id: session.userId, activo: true } });
    if (!user || !isRole(user.role)) {
      await this.sessions.update(session.id, { revokedAt: now, lastUsedAt: now });
      this.rememberRevokedSession(session.id, session.absoluteExpiresAt);
      throw new UnauthorizedException('Sesión ausente o inválida.');
    }

    const tokens = await this.createTokenPair(user, session.id, session.absoluteExpiresAt);

    const result = await this.sessions
      .createQueryBuilder()
      .update(AuthSession)
      .set({
        tokenHash: this.hashToken(tokens.accessToken),
        expiresAt: tokens.accessExpiresAt,
        refreshTokenHash: this.hashToken(tokens.refreshToken),
        refreshExpiresAt: tokens.refreshExpiresAt,
        lastUsedAt: now,
      })
      .where('id = :id', { id: session.id })
      .andWhere('refresh_token_hash = :currentHash', { currentHash })
      .andWhere('revoked_at IS NULL')
      .execute();
    if (result.affected !== 1) {
      throw new UnauthorizedException('Refresh token expirado, revocado o reutilizado.');
    }

    return tokens;
  }

  /**
   * Valida un access token SIN ir a la base (firma + vencimiento + sesión no revocada).
   * Rechaza tokens cuyo rol no pertenece a los roles válidos del sistema.
   * @throws AccessTokenExpiredException si solo está vencido (hay que usar el refresh).
   */
  async verifyAccessToken(token: string): Promise<AuthUser> {
    const claims = await this.verifyToken(token, 'access');

    if (this.isSessionRevoked(claims.sid)) throw new UnauthorizedException('Sesión revocada.');
    if (!claims.role || !claims.usuario || !claims.email) throw new UnauthorizedException('Access token inválido.');
    if (!isRole(claims.role)) {
      throw new UnauthorizedException('Tu usuario no tiene acceso al backoffice.');
    }

    return {
      id: Number(claims.sub),
      usuario: claims.usuario,
      nombre: claims.usuario,
      email: claims.email,
      roles: [Role[claims.role]],
    };
  }

  isAccessTokenExpired(error: unknown): boolean {
    return error instanceof AccessTokenExpiredException;
  }

  /** Revoca la sesión a la que pertenecen los tokens (si existe). */
  async logout(accessToken?: string, refreshToken?: string): Promise<void> {
    const where = [
      ...(accessToken ? [{ tokenHash: this.hashToken(accessToken) }] : []),
      ...(refreshToken ? [{ refreshTokenHash: this.hashToken(refreshToken) }] : []),
    ];
    if (where.length === 0) return;

    const session = await this.sessions.findOne({ where });
    if (!session) return;

    const now = new Date();
    const result = await this.sessions.update({ id: session.id, revokedAt: IsNull() }, { revokedAt: now, lastUsedAt: now });
    if (result.affected === 1) this.rememberRevokedSession(session.id, session.absoluteExpiresAt);
  }

  // ---------------------------------------------------------------- internos

  private async markExpiredSessions(): Promise<void> {
    const now = new Date();
    await this.sessions
      .createQueryBuilder()
      .update(AuthSession)
      .set({ revokedAt: now })
      .where('revoked_at IS NULL')
      .andWhere('(refresh_expires_at <= :now OR absolute_expires_at <= :now)', { now })
      .execute();
  }

  private isSessionRevoked(sessionId: number): boolean {
    const expiresAt = this.revokedSessions.get(sessionId);
    if (expiresAt === undefined) return false;
    if (expiresAt > Date.now()) return true;
    this.revokedSessions.delete(sessionId);
    return false;
  }

  private rememberRevokedSession(sessionId: number, absoluteExpiresAt: Date): void {
    if (absoluteExpiresAt.getTime() > Date.now()) {
      this.revokedSessions.set(sessionId, absoluteExpiresAt.getTime());
    }
  }

  private developmentUser(): Pick<User, 'id' | 'role' | 'usuario' | 'email'> {
    return { id: 0, usuario: 'dev-admin', email: 'dev-admin@localhost', role: Role.admin };
  }

  private async createTokenPair(
    user: Pick<User, 'id' | 'role' | 'usuario' | 'email'>,
    sessionId: number,
    absoluteExpiresAt: Date,
  ): Promise<AuthTokens> {
    if (!isRole(user.role)) throw new Error(`Rol persistido inválido: ${user.role}`);

    const now = Date.now();
    const accessExpiresAt = this.expiryAfter(this.config.auth.accessTokenTtlMs, absoluteExpiresAt);
    const refreshExpiresAt = this.expiryAfter(this.config.auth.refreshTokenTtlMs, absoluteExpiresAt);
    const seconds = (d: Date) => Math.max(1, Math.floor((d.getTime() - now) / 1000));

    const accessToken = await this.jwt.signAsync(
      {
        sub: String(user.id),
        sid: sessionId,
        typ: 'access',
        jti: randomUUID(),
        role: user.role,
        permissions: [],
        usuario: user.usuario,
        email: user.email,
        ...(sessionId === 0 ? { dev: true, abs: absoluteExpiresAt.getTime() } : {}),
      },
      { expiresIn: seconds(accessExpiresAt) },
    );
    const refreshToken = await this.jwt.signAsync(
      {
        sub: String(user.id),
        sid: sessionId,
        typ: 'refresh',
        jti: randomUUID(),
        ...(sessionId === 0 ? { dev: true, abs: absoluteExpiresAt.getTime() } : {}),
      },
      { expiresIn: seconds(refreshExpiresAt) },
    );

    return {
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.usuario,
        email: user.email,
        roles: [Role[user.role]],
      },
    };
  }

  private async verifyToken(token: string, expectedType: SessionJwtClaims['typ']): Promise<SessionJwtClaims> {
    let claims: SessionJwtClaims;
    try {
      claims = await this.jwt.verifyAsync<SessionJwtClaims>(token);
    } catch (error) {
      if (expectedType === 'access' && error instanceof Error && error.name === 'TokenExpiredError') {
        throw new AccessTokenExpiredException();
      }
      throw new UnauthorizedException('Token ausente, inválido o vencido.');
    }

    if (claims.typ !== expectedType || !claims.sub || !Number.isSafeInteger(claims.sid) || !claims.jti) {
      throw new UnauthorizedException('Token inválido.');
    }
    return claims;
  }

  /** Vencimiento tras `durationMs`, sin pasar del tope absoluto de la sesión. */
  private expiryAfter(durationMs: number, absoluteExpiresAt: Date): Date {
    return new Date(Math.min(Date.now() + durationMs, absoluteExpiresAt.getTime()));
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
