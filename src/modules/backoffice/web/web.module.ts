import { Module } from '@nestjs/common';
import { DomainModule } from '../../domain/domain.module';
import { BannersController } from './banners.controller';
import { InicioController } from './inicio.controller';
import { NoticiasController } from './noticias.controller';
import { PaginasController } from './paginas.controller';

/** Sección "Gestión WEB" del backoffice: inicio, noticias, banners y páginas. */
@Module({
  imports: [DomainModule],
  controllers: [InicioController, NoticiasController, BannersController, PaginasController],
})
export class WebModule {}
