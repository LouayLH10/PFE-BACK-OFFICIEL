import {
  IsString,
  IsEmail,
  IsDateString,
  IsInt,
  IsOptional
} from 'class-validator';

export class CreatePurchaseOrderDto {

  @IsString()
  supplierName: string;

  @IsEmail()
  supplierEmail: string;

  @IsString()
  supplierPhone: string;

  @IsDateString()
  orderDate: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  contactId: number;
}