import { Module } from '@nestjs/common';
import { PaginasController } from './paginas.controller';
import { PaginasService } from './paginas.service';

/** Páginas estáticas del sitio (Gestión WEB). */
@Module({
  controllers: [PaginasController],
  providers: [PaginasService],
  exports: [PaginasService],
})
export class PaginasModule {}
