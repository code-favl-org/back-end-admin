import { Module } from '@nestjs/common';
import { ClubesController } from './clubes.controller';

/** Sección "Clubes" del backoffice. */
@Module({ controllers: [ClubesController] })
export class ClubesModule {}
