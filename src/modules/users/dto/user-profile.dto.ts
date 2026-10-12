import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

const cleanText = Transform(({ value }) =>
  typeof value === 'string' ? value.trim() || null : value,
);

export class UserProfileDto {
  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(100)
  photo?: string | null;

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
  @IsString()
  @MaxLength(2)
  country?: string | null;

  @cleanText
  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobilePhone?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(2)
  gender?: string | null;
}
