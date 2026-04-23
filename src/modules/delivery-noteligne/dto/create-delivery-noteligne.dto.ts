import { IsString, IsInt } from 'class-validator';

export class CreateDeliveryNoteligneDto {
      @IsString()
  description: string;

  @IsInt()
  quantity: number;

  @IsString()
  unity: string;

  @IsInt()
  deliveryNoteId: number;
}
