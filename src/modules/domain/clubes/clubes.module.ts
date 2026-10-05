import { Module } from '@nestjs/common';
import { SitiosService } from './sitios.service';
import { ClubesService } from './clubes.service';

/** Dominio: clubes y puntos del mapa (sitios de vuelo, clubes, escuelas). */
@Module({ providers: [ClubesService, SitiosService], exports: [ClubesService, SitiosService] })
export class ClubesDomainModule {}
