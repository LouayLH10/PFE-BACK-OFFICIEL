import { Contact } from "@prisma/client";

export class Quote {
  id: number;
  adresse: string;
  phone: string;
  email: string;
  webSite: string;

  date: Date;
  validationDate: Date;

  subject: string;

  amount: number;
  tva: number;
  totalAmount: number;

  contactId: number;
  contact: Contact;
}