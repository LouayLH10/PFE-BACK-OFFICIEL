import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsInt
} from 'class-validator';

export enum PhaseStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class CreatePhaseDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate: string;

  @IsEnum(PhaseStatus)
  status: PhaseStatus;

  @IsInt()
  projectId: number;
}