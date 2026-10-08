import { Module } from '@nestjs/common';
import { InicioController } from './inicio.controller';
import { InicioService } from './inicio.service';

/** Portada del sitio (Gestión WEB). */
@Module({
  controllers: [InicioController],
  providers: [InicioService],
  exports: [InicioService],
})
export class InicioModule {}
