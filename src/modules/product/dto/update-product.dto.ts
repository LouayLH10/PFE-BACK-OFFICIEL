import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Unit } from '@prisma/client';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    
  @IsOptional()
  @IsEnum(Unit)
  unit?: Unit;
}
