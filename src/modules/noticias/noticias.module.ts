import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { NewsArticle } from './entity/news-article.entity';
import { NoticiasController } from './noticias.controller';
import { NoticiasService } from './noticias.service';

/** Noticias del sitio (Gestión WEB): tabla `news_articles`, compartida con back-end-public. */
@Module({
  imports: [TypeOrmModule.forFeature([NewsArticle, User])],
  controllers: [NoticiasController],
  providers: [NoticiasService],
  exports: [NoticiasService],
})
export class NoticiasModule {}
