import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavlClubsModule } from '../favl-clubs/favl-clubs.module';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { FavlNewPilot } from './entities/favl-new-pilot.entity';
import { FavlPilot } from './entities/favl-pilot.entity';
import { FavlNewPilotsController } from './favl-new-pilots.controller';
import { FavlNewPilotsService } from './favl-new-pilots.service';
import { FavlPilotsController } from './favl-pilots.controller';
import { FavlPilotsService } from './favl-pilots.service';
import { PadronPilotosController } from './padron-pilotos.controller';
import { PilotosService } from './padron-pilotos.service';
import { PilotPortalController } from './pilot-portal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FavlPilot, FavlNewPilot, User, UserProfile]), FavlClubsModule],
  controllers: [FavlPilotsController, FavlNewPilotsController, PilotPortalController, PadronPilotosController],
  providers: [FavlPilotsService, FavlNewPilotsService, PilotosService],
  exports: [FavlPilotsService, FavlNewPilotsService],
})
export class FavlPilotsModule {}
