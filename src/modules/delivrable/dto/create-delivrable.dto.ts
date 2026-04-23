import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsInt
} from 'class-validator';

export enum DeliverableStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export class CreateDelivrableDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  deadline: string;

  @IsEnum(DeliverableStatus)
  status: DeliverableStatus;

  @IsInt()
  phaseId: number;
}