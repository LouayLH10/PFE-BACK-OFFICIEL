import { PartialType } from '@nestjs/mapped-types';
import { CreateDelivrableDto } from './create-delivrable.dto';

export class UpdateDelivrableDto extends PartialType(CreateDelivrableDto) {}
