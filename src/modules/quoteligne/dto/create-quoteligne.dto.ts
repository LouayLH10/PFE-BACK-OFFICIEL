import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class CreateQuoteligneDto {
  
  @IsString()
  description: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsInt()
  quoteId: number;
  @IsString()
  unity:string;
}