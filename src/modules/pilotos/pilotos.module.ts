import { Module } from '@nestjs/common';
import { ClubesModule } from '../clubes/clubes.module';
import { PilotosController } from './pilotos.controller';
import { PilotosService } from './pilotos.service';

/** Padrón de pilotos y cuotas. */
@Module({
  imports: [ClubesModule],
  controllers: [PilotosController],
  providers: [PilotosService],
  exports: [PilotosService],
})
export class PilotosModule {}
