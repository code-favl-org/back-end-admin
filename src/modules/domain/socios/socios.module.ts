import { Module } from '@nestjs/common';
import { PilotosService } from './pilotos.service';
import { SociosService } from './socios.service';

/** Dominio: socios, cuotas y verificación pública de pilotos. */
@Module({ providers: [SociosService, PilotosService], exports: [SociosService, PilotosService] })
export class SociosDomainModule {}
