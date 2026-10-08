import { Module } from '@nestjs/common';
import { ClubesController } from './clubes.controller';
import { ClubesService } from './clubes.service';

/** Clubes. */
@Module({
  controllers: [ClubesController],
  providers: [ClubesService],
  exports: [ClubesService],
})
export class ClubesModule {}
