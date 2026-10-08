import { Module } from '@nestjs/common';
import { PanelController } from './panel.controller';

/** Panel de inicio del backoffice. */
@Module({ controllers: [PanelController] })
export class PanelModule {}
