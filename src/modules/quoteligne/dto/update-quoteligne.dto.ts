import { PartialType } from '@nestjs/mapped-types';
import { CreateQuoteligneDto } from './create-quoteligne.dto';

export class UpdateQuoteligneDto extends PartialType(CreateQuoteligneDto) {}
