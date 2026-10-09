import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Home } from './entity/home.entity';
import { InicioController } from './inicio.controller';
import { InicioService } from './inicio.service';

/** Portada del sitio (Gestión WEB). */
@Module({
  imports: [TypeOrmModule.forFeature([Home])],
  controllers: [InicioController],
  providers: [InicioService],
  exports: [InicioService],
})
export class InicioModule {}
