 enum ProjectStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
}
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  IsDate
} from 'class-validator';

export class CreateProjectDto {

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate: string;
@IsInt()
 contactId: number;
 @IsDate()
 createdAt:Date;
}