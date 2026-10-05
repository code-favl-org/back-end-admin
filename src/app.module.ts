import { Module } from '@nestjs/common';
import { AppConfigModule } from '@common/config';
import { GuardsModule } from '@common/guards';
import { HashingModule } from '@common/hashing';
import { ApiModule } from './modules/api/api.module';
import { BackofficeModule } from './modules/backoffice/backoffice.module';
import { CoreModule } from './modules/core/core.module';
import { DomainModule } from './modules/domain/domain.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    // common: base compartida
    AppConfigModule,
    HashingModule,
    GuardsModule, // AuthGuard + RolesGuard globales (todo exige sesión salvo @Public)

    // modules
    CoreModule,       // usuarios + autenticación
    DomainModule,     // lógica de negocio (socios, clubes, contenido)
    ApiModule,        // /api/...    JSON, anónimo por ahora
    PublicModule,     // /           sitio público, anónimo
    BackofficeModule, // /admin/...  administración, con roles
  ],
})
export class AppModule {}
