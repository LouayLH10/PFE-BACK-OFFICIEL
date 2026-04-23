import { IsString, IsInt, IsNumber } from 'class-validator';
export class CreatePurchaseOrderligneDto {
    @IsString()
  description: string;

  @IsInt()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsString()
  unity: string;

  @IsNumber()
  tva: number; // ex: 19

  @IsInt()
  purchaseOrderId: number;
}
