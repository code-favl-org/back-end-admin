import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators';
import { Roles } from '../../common/authorization';
import { FavlFormValidationFilter } from '../../common/filters/favl-form-validation.filter';
import type { AuthUser } from '../../common/types';
import { Role } from '../../common/types/role';
import { imageUploads } from '../../common/upload/image-upload';
import { FavlClubDto } from './dto/favl-club.dto';
import { FavlClubsService } from './favl-clubs.service';

const BASE_PATH = '/admin/favl-clubs';
const PROFILE_PATH = `${BASE_PATH}/perfil`;
const FORM_VIEW = 'favl-clubs/views/formulario';
const CLUB_LOGO = imageUploads('img/club');

@ApiTags('Portal del club')
@Controller(BASE_PATH)
@Roles(Role.club)
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}))
@UseFilters(new FavlFormValidationFilter({
  basePath: PROFILE_PATH,
  createTitle: 'Mi perfil del club',
  editTitle: 'Mi perfil del club',
  formView: FORM_VIEW,
  creating: false,
}))
export class ClubPortalController {
  constructor(private readonly clubs: FavlClubsService) {}

  @Get()
  async panel(
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ) {
    const club = await this.clubs.obtenerDeUsuario(user.id);
    return response.render('favl-clubs/views/club-panel', {
      club,
      email: club.email,
    });
  }

  @Get('perfil')
  async perfil(
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ) {
    const registro = await this.clubs.obtenerDeUsuario(user.id);
    return response.render(FORM_VIEW, {
      titulo: 'Mi perfil del club',
      basePath: PROFILE_PATH,
      action: PROFILE_PATH,
      registro,
      creating: false,
    });
  }

  @Post('perfil')
  @UseInterceptors(FileInterceptor('logo', CLUB_LOGO.opciones))
  async actualizarPerfil(
    @CurrentUser() user: AuthUser,
    @Body() body: FavlClubDto,
    @Res() response: Response,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    try {
      await this.clubs.actualizarPerfilUsuario(
        user.id,
        body,
        logo ? CLUB_LOGO.urlDe(logo.filename) : undefined,
      );
      return response.redirect(PROFILE_PATH);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      return response.status(error.getStatus()).render(FORM_VIEW, {
        titulo: 'Mi perfil del club',
        basePath: PROFILE_PATH,
        action: PROFILE_PATH,
        registro: { ...body },
        creating: false,
        error: error.message,
      });
    }
  }
}
