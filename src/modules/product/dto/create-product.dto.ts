import { Unit } from "@prisma/client";

export class CreateProductDto {
  reference: string;

  name: string;

  description: string;

  unitPrice: number;

  stock: number;

unit: Unit;
  taxRate: number;


  active: boolean;
}