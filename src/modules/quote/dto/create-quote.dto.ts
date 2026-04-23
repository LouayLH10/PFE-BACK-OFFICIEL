import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEmail,
  IsInt,
  IsEnum,
  isString
} from 'class-validator';
export enum QuoteStatus {
  ON_HOLD = 'ON_HOLD',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
}

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  adresse: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  webSite?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  tva: number;
  @IsString()
  reference:string;
  @IsNumber()
  totalAmount: number;
  @IsEnum(QuoteStatus)
  status: QuoteStatus;
  @IsInt()
  contactId: number;
}