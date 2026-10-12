import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavlSchool } from './entities/favl-school.entity';
import { FavlSchoolsController } from './favl-schools.controller';
import { FavlSchoolsService } from './favl-schools.service';

@Module({
  imports: [TypeOrmModule.forFeature([FavlSchool])],
  controllers: [FavlSchoolsController],
  providers: [FavlSchoolsService],
  exports: [FavlSchoolsService],
})
export class FavlSchoolsModule {}
