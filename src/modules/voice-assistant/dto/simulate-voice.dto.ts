import { IsString } from 'class-validator';

export class SimulateVoiceDto {
  @IsString()
  text: string;
}