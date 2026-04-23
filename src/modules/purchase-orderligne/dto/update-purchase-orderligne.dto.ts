import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderligneDto } from './create-purchase-orderligne.dto';

export class UpdatePurchaseOrderligneDto extends PartialType(CreatePurchaseOrderligneDto) {}
