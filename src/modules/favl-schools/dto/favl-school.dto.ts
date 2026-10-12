import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const cleanText = Transform(({ value }) =>
  typeof value === 'string' ? value.trim() || null : value,
);

export class FavlSchoolDto {
  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  @cleanText
  @IsOptional()
  @IsEmail()
  @MaxLength(50)
  email?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(100)
  website?: string | null;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    return /^\d+$/.test(String(value)) ? Number(value) : value;
  })
  @IsOptional()
  @IsInt()
  responsiblePilotLicenseNumber?: number | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string | null;

  @cleanText
  @IsOptional()
  @Matches(/^-?\d+(?:\.\d+)?$/)
  latitude?: string | null;

  @cleanText
  @IsOptional()
  @Matches(/^-?\d+(?:\.\d+)?$/)
  longitude?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(2)
  schoolType?: string | null;
}
