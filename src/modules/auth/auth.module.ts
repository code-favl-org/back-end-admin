import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_CONFIG, AppConfig } from '../../config';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSession } from './entities/auth-session.entity';
import { SessionMiddleware } from './session.middleware';
import { SessionService } from './session.service';

/** Login, logout, sesiones en base (JWT access + refresh) y middleware que completa `req.user`. */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthSession]),
    // Mismos parámetros que back-end-public: así los tokens de uno valen en el otro.
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.auth.jwtSecret,
        signOptions: { algorithm: 'HS256' as const, issuer: 'favl-api', audience: 'favl-api' },
        verifyOptions: { algorithms: ['HS256' as const], issuer: 'favl-api', audience: 'favl-api' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionService, SessionMiddleware],
  exports: [AuthService, SessionService, SessionMiddleware],
})
export class AuthModule {}
