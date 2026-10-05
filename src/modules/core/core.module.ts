import { Module } from '@nestjs/common';
import { ApiAuthModule } from './api-auth/api-auth.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

/** Infraestructura transversal: usuarios, autenticación del backoffice e identificación de clientes de la API. No conoce el negocio. */
@Module({
  imports: [UsersModule, AuthModule, ApiAuthModule],
  exports: [UsersModule, AuthModule, ApiAuthModule],
})
export class CoreModule {}
