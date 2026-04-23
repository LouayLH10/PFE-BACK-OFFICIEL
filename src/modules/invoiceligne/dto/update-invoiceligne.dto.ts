import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceLigneDto } from './create-invoiceligne.dto';

export class UpdateInvoiceligneDto extends PartialType(CreateInvoiceLigneDto) {}
