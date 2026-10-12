import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const cleanText = Transform(({ value }) =>
  typeof value === 'string' ? value.trim() || null : value,
);

export class FavlPilotDto {
  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(20)
  document?: string | null;

  @cleanText
  @IsOptional()
  @IsIn(['dni', 'pasaporte'])
  documentType?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string | null;

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
  @IsEmail()
  @MaxLength(100)
  email?: string | null;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    return value === '0' || value === 0 ? 0 : value === '1' || value === 1 ? 1 : value;
  })
  @IsOptional()
  @IsIn([0, 1])
  emailPrivate?: number | null;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    return value === '0' || value === 0 ? 0 : value === '1' || value === 1 ? 1 : value;
  })
  @IsOptional()
  @IsIn([0, 1])
  phonePrivate?: number | null;

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

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    return value === '0' || value === 0 ? 0 : value === '1' || value === 1 ? 1 : value;
  })
  @IsIn([0, 1])
  emergencyContactPrivate!: number;

  @cleanText
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  emergencyContactName!: string;

  @cleanText
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  emergencyContactPhone!: string;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    return value === '0' || value === 0 ? 0 : value === '1' || value === 1 ? 1 : value;
  })
  @IsOptional()
  @IsIn([0, 1])
  whatsapp?: number | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(2)
  gender?: string | null;

  @cleanText
  @IsOptional()
  @IsString()
  @MaxLength(2)
  termsAndConditionsAccepted?: string | null;
}
