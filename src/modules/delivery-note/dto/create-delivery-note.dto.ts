import { IsString, IsInt, IsDateString } from 'class-validator';

export class CreateDeliveryNoteDto {

  @IsDateString()
  deliveryDate: string;

  @IsString()
  location: string;

  @IsInt()
  contactId: number;
}