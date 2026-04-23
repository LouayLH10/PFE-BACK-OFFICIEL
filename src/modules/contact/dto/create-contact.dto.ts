import { IsString, IsEmail, Length, IsInt } from 'class-validator';
import { User } from 'src/users/entities/user.entity';

export class CreateContactDto {

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 8)
  phone: string;

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;
  @IsInt()
  userId: number; 
}