import { Module } from '@nestjs/common';
import { DomainModule } from '../../domain/domain.module';
import { SociosController } from './socios.controller';

/** Sección "Socios" del backoffice (padrón y cuotas). */
@Module({ imports: [DomainModule], controllers: [SociosController] })
export class SociosModule {}
