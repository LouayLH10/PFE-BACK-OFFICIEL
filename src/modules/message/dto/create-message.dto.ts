import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  senderId: number;

  @IsInt()
  receiverId: number;
  @IsDate()
  dateSent:Date;
}