import { IsString, IsInt, IsNumber } from 'class-validator';

export class CreateInvoiceLigneDto {

  @IsString()
  description: string;

  @IsInt()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  totalPrice: number;

  @IsString()
  unity: string;

  @IsInt()
  invoiceId: number;
}