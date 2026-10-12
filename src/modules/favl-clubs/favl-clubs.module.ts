import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { FavlClub } from './entities/favl-club.entity';
import { ClubPortalController } from './club-portal.controller';
import { FavlClubsController } from './favl-clubs.controller';
import { FavlClubsService } from './favl-clubs.service';

@Module({
  imports: [TypeOrmModule.forFeature([FavlClub, User, UserProfile])],
  controllers: [FavlClubsController, ClubPortalController],
  providers: [FavlClubsService],
  exports: [FavlClubsService],
})
export class FavlClubsModule {}
