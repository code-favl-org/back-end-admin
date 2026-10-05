import { Module } from '@nestjs/common';
import { BannersService } from './banners.service';
import { EventosService } from './eventos.service';
import { GaleriaService } from './galeria.service';
import { InicioService } from './inicio.service';
import { NoticiasService } from './noticias.service';
import { PaginasService } from './paginas.service';
import { StatsService } from './stats.service';

const services = [
  InicioService,
  NoticiasService,
  BannersService,
  PaginasService,
  EventosService,
  GaleriaService,
  StatsService,
];

/** Contenido del sitio web (lo que "Gestión WEB" edita y el sitio público muestra). */
@Module({ providers: services, exports: services })
export class ContenidoDomainModule {}
