import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsEnum
} from 'class-validator';

export enum MilestoneStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class CreateMilestoneDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  deadline: string;

  @IsEnum(MilestoneStatus)
  status: MilestoneStatus;

  @IsInt()
  projectId: number;
}