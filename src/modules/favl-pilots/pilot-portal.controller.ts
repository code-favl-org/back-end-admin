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
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators';
import { Roles } from '../../common/authorization';
import { FavlFormValidationFilter } from '../../common/filters/favl-form-validation.filter';
import type { AuthUser } from '../../common/types';
import { Role } from '../../common/types/role';
import { imageUploads } from '../../common/upload/image-upload';
import { FavlPilotDto } from './dto/favl-pilot.dto';
import { FavlPilotsService } from './favl-pilots.service';

const BASE_PATH = '/admin/favl-pilots';
const PROFILE_PATH = `${BASE_PATH}/perfil`;
const FORM_VIEW = 'favl-pilots/views/formulario';
const PILOT_PHOTO = imageUploads('img/piloto');

@Controller(BASE_PATH)
@Roles(Role.piloto)
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}))
@UseFilters(new FavlFormValidationFilter({
  basePath: PROFILE_PATH,
  createTitle: 'Mi perfil de piloto',
  editTitle: 'Mi perfil de piloto',
  formView: FORM_VIEW,
  creating: false,
  hideTerms: true,
}))
export class PilotPortalController {
  constructor(private readonly pilots: FavlPilotsService) {}

  @Get()
  async panel(
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ) {
    const pilot = await this.pilots.obtenerDeUsuario(user.id);
    return response.render('favl-pilots/views/pilot-panel', {
      piloto: pilot,
      email: pilot.email,
    });
  }

  @Get('perfil')
  async perfil(
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ) {
    const registro = await this.pilots.obtenerDeUsuario(user.id);
    return response.render(FORM_VIEW, {
      titulo: 'Mi perfil de piloto',
      basePath: PROFILE_PATH,
      action: PROFILE_PATH,
      registro,
      creating: false,
      hideTerms: true,
    });
  }

  @Post('perfil')
  @UseInterceptors(FileInterceptor('photo', PILOT_PHOTO.opciones))
  async actualizarPerfil(
    @CurrentUser() user: AuthUser,
    @Body() body: FavlPilotDto,
    @Res() response: Response,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    try {
      await this.pilots.actualizarPerfilUsuario(
        user.id,
        body,
        photo ? PILOT_PHOTO.urlDe(photo.filename) : undefined,
      );
      return response.redirect(PROFILE_PATH);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      return response.status(error.getStatus()).render(FORM_VIEW, {
        titulo: 'Mi perfil de piloto',
        basePath: PROFILE_PATH,
        action: PROFILE_PATH,
        registro: { ...body },
        creating: false,
        hideTerms: true,
        error: error.message,
      });
    }
  }
}
