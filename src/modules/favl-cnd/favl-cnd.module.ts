import { Module } from '@nestjs/common';
import { FavlCndController } from './favl-cnd.controller';
import { FavlCndService } from './favl-cnd.service';

/** MOCKUP de la CND: sin persistencia propia, solo la consulta a la API externa. */
@Module({
  controllers: [FavlCndController],
  providers: [FavlCndService],
})
export class FavlCndModule {}
