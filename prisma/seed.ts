import { PrismaClient, Unit } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({
  adapter,
});
async function main() {

  // ===========================
  // Categories
  // ===========================

const allProducts = await prisma.product.findMany();
const translations = [

{
reference:"PRD-0001",
language:"fr",
name:"Ordinateur Dell Latitude",
description:"Ordinateur portable Intel Core i7"
},

{
reference:"PRD-0001",
language:"en",
name:"Dell Latitude Laptop",
description:"Intel Core i7 Laptop"
},

{
reference:"PRD-0002",
language:"fr",
name:"Ordinateur HP ProBook",
description:"Ordinateur portable professionnel"
},

{
reference:"PRD-0002",
language:"en",
name:"HP ProBook Laptop",
description:"Business Laptop"
},

{
reference:"PRD-0003",
language:"fr",
name:"Écran Dell 24 pouces",
description:"Moniteur IPS 24 pouces"
},

{
reference:"PRD-0003",
language:"en",
name:"Dell 24 Inch Monitor",
description:"24 Inch IPS Monitor"
},

{
reference:"PRD-0004",
language:"fr",
name:"Souris sans fil",
description:"Souris Logitech"
},

{
reference:"PRD-0004",
language:"en",
name:"Wireless Mouse",
description:"Logitech Mouse"
},

{
reference:"PRD-0005",
language:"fr",
name:"Clavier mécanique",
description:"Clavier RGB"
},

{
reference:"PRD-0005",
language:"en",
name:"Mechanical Keyboard",
description:"RGB Keyboard"
},

{
reference:"PRD-0006",
language:"fr",
name:"Routeur Cisco",
description:"Routeur professionnel"
},

{
reference:"PRD-0006",
language:"en",
name:"Cisco Router",
description:"Enterprise Router"
},

{
reference:"PRD-0007",
language:"fr",
name:"Commutateur réseau 24 ports",
description:"Switch Gigabit"
},

{
reference:"PRD-0007",
language:"en",
name:"24-Port Network Switch",
description:"Gigabit Switch"
},

{
reference:"PRD-0008",
language:"fr",
name:"Licence Windows 11 Pro",
description:"Licence Microsoft"
},

{
reference:"PRD-0008",
language:"en",
name:"Windows 11 Pro License",
description:"Microsoft License"
},

{
reference:"PRD-0009",
language:"fr",
name:"Microsoft Office 365",
description:"Abonnement professionnel"
},

{
reference:"PRD-0009",
language:"en",
name:"Microsoft Office 365",
description:"Business Subscription"
},

{
reference:"PRD-0010",
language:"fr",
name:"Service d'installation",
description:"Installation et configuration"
},

{
reference:"PRD-0010",
language:"en",
name:"Installation Service",
description:"Installation and Configuration"
}

];
for (const item of translations) {

    const product = allProducts.find(
        p => p.reference === item.reference,
    );

    if (!product) continue;

    await prisma.productTranslation.upsert({

        where: {
            productId_language: {
                productId: product.id,
                language: item.language,
            },
        },

        update: {},

        create: {
            language: item.language,
            name: item.name,
            description: item.description,
            product: {
                connect: {
                    id: product.id,
                },
            },
        },

    });

}
console.log("✅ Product translations inserted");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });