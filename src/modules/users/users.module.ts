import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';

/** Administración de las cuentas que pueden acceder al backoffice. */
@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  controllers: [UsersController, UserProfileController],
  providers: [UsersService, UserProfileService],
})
export class UsersModule {}
