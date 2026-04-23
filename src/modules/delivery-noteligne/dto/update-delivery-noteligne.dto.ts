import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryNoteligneDto } from './create-delivery-noteligne.dto';

export class UpdateDeliveryNoteligneDto extends PartialType(CreateDeliveryNoteligneDto) {}
