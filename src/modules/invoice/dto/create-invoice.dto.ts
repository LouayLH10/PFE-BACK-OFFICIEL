import { IsString, IsNumber, IsDateString, IsEnum, IsInt } from 'class-validator';
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}
export class CreateInvoiceDto {
  @IsString()
  name: string;

@IsEnum(InvoiceStatus)
status: InvoiceStatus;
  @IsString()
  reference:string;
  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  subTotal: number;

  @IsNumber()
  discountTotal: number;

  @IsNumber()
  amountPaid: number;

  @IsNumber()
  balanceDue: number;

  @IsNumber()
  total: number;
@IsNumber()
tva:number;
  @IsString()
  paymentTerms: string;

  @IsString()
  currency: string;
  @IsInt()
 contactId: number;
   @IsInt()
projectId: number;
}