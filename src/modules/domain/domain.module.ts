import { Module } from '@nestjs/common';
import { ClubesDomainModule } from './clubes/clubes.module';
import { ContenidoDomainModule } from './contenido/contenido.module';
import { SociosDomainModule } from './socios/socios.module';

const areas = [SociosDomainModule, ClubesDomainModule, ContenidoDomainModule];

/**
 * Lógica de negocio compartida. api, public y backoffice importan ESTE
 * módulo; el dominio no sabe quién lo consume (no depende de ninguno de ellos).
 */
@Module({ imports: areas, exports: areas })
export class DomainModule {}
