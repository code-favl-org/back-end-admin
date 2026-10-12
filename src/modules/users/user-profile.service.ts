import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { eliminarImagenSubida } from '../../common/upload/image-upload';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserProfile } from './entities/user-profile.entity';
import { ensureUserProfile } from './user-profile.util';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
  ) {}

  async obtener(userId: number): Promise<UserProfile> {
    return ensureUserProfile(this.profiles.manager, userId);
  }

  async actualizar(userId: number, input: UserProfileDto, photo?: string): Promise<void> {
    const profile = await this.obtener(userId);
    const fields = { ...input };
    delete fields.photo;
    Object.assign(profile, fields);
    const previousPhoto = profile.photo;
    if (photo) profile.photo = photo;
    await this.profiles.save(profile);
    if (photo) eliminarImagenSubida(previousPhoto);
  }
}
