import { Module } from '@nestjs/common';
import { ClubesModule } from '../clubes/clubes.module';
import { SociosController } from './socios.controller';
import { SociosService } from './socios.service';

/** Padrón de socios y cuotas. */
@Module({
  imports: [ClubesModule],
  controllers: [SociosController],
  providers: [SociosService],
  exports: [SociosService],
})
export class SociosModule {}
