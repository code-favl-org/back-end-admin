import {
  Body,
  Controller,
  Get,
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
import { UserProfileDto } from './dto/user-profile.dto';
import { UserProfileService } from './user-profile.service';

const PROFILE_PATH = '/admin/perfil';
const PROFILE_VIEW = 'users/views/perfil';
const USER_PHOTO = imageUploads('img/usuarios');

@Controller(PROFILE_PATH)
@Roles(Role.admin, Role.editor, Role.tesorero, Role.cd)
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}))
@UseFilters(new FavlFormValidationFilter({
  basePath: PROFILE_PATH,
  createTitle: 'Mi perfil',
  editTitle: 'Mi perfil',
  formView: PROFILE_VIEW,
  creating: false,
}))
export class UserProfileController {
  constructor(private readonly profiles: UserProfileService) {}

  @Get()
  async perfil(
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ) {
    return response.render(PROFILE_VIEW, {
      titulo: 'Mi perfil',
      action: PROFILE_PATH,
      registro: await this.profiles.obtener(user.id),
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('photo', USER_PHOTO.opciones))
  async actualizar(
    @CurrentUser() user: AuthUser,
    @Body() body: UserProfileDto,
    @Res() response: Response,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    await this.profiles.actualizar(
      user.id,
      body,
      photo ? USER_PHOTO.urlDe(photo.filename) : undefined,
    );
    return response.redirect(PROFILE_PATH);
  }
}
