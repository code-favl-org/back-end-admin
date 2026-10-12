import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const cleanText = Transform(({ value }) =>
  typeof value === 'string' ? value.trim() || null : value,
);

export class FavlClubDto {
  @cleanText
  @IsOptional()
  @cleanText
  @IsString()
  @MaxLength(100)
  logo?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(20)
  name?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(11)
  taxId?: string | null;

  @cleanText
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(100)
  website?: string | null;

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
  @Matches(/^-?\d+(?:\.\d+)?$/)
  latitude?: string | null;

  @cleanText
  @IsOptional()
  @Matches(/^-?\d+(?:\.\d+)?$/)
  longitude?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(85)
  legalId?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(20)
  legalStatus?: string | null;

  @cleanText
  @IsString()
  @IsNotEmpty()
  status!: string;

  @cleanText
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  comments!: string;
}
