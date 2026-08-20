import { PrismaClient, Unit } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Seeding...");

  // ===================================================
  // CATEGORY
  // ===================================================



  console.log("✅ Category inserted");

  // ===================================================
  // PRODUCTS
  // ===================================================

  const products = [
    {
      reference: "PRD-0001",
      name: "Dell Latitude Laptop",
      description: "Intel Core i7 Laptop",
      unitPrice: 3200,
      stock: 15,
      unit: Unit.PIECE,
      taxRate: 19,
    },
    {
      reference: "PRD-0002",
      name: "HP ProBook Laptop",
      description: "Business Laptop",
      unitPrice: 2800,
      stock: 10,
      unit: Unit.PIECE,
      taxRate: 19,
    },
    {
      reference: "PRD-0003",
      name: "Dell Monitor 24",
      description: "24 Inch IPS Monitor",
      unitPrice: 650,
      stock: 20,
      unit: Unit.PIECE,
      taxRate: 19,
    },
    {
      reference: "PRD-0004",
      name: "Wireless Mouse",
      description: "Logitech Mouse",
      unitPrice: 80,
      stock: 100,
      unit: Unit.PIECE,
      taxRate: 19,
    },
    {
      reference: "PRD-0005",
      name: "Mechanical Keyboard",
      description: "RGB Keyboard",
      unitPrice: 220,
      stock: 60,
      unit: Unit.PIECE,
      taxRate: 19,
    },
    {
      reference: "PRD-0006",
      name: "Cisco Router",
      description: "Enterprise Router",
      unitPrice: 1450,
      stock: 12,
      unit: Unit.PIECE,
      taxRate: 19,
    },
    {
      reference: "PRD-0007",
      name: "24-Port Network Switch",
      description: "Gigabit Switch",
      unitPrice: 980,
      stock: 18,
      unit: Unit.PIECE,
      taxRate: 19,
    },
    {
      reference: "PRD-0008",
      name: "Windows 11 Pro License",
      description: "Microsoft License",
      unitPrice: 950,
      stock: 50,
      unit: Unit.PIECE,
      taxRate: 19,
    },
    {
      reference: "PRD-0009",
      name: "Microsoft Office 365",
      description: "Business Subscription",
      unitPrice: 420,
      stock: 80,
      unit: Unit.PIECE,
      taxRate: 19,
    },
    {
      reference: "PRD-0010",
      name: "Installation Service",
      description: "Installation and Configuration",
      unitPrice: 150,
      stock: 9999,
      unit: Unit.SERVICE,
      taxRate: 19,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        reference: product.reference,
      },
      update: {},
      create: {
        reference: product.reference,
        name: product.name,
        description: product.description,
        unitPrice: product.unitPrice,
        stock: product.stock,
        unit: product.unit,
        taxRate: product.taxRate,

      },
    });
  }

  console.log("✅ Products inserted");

  // ===================================================
  // PRODUCT TRANSLATIONS
  // ===================================================

  const allProducts = await prisma.product.findMany();

  const translations = [
    ["PRD-0001","fr","Ordinateur Dell Latitude","Ordinateur portable Intel Core i7"],
    ["PRD-0001","en","Dell Latitude Laptop","Intel Core i7 Laptop"],

    ["PRD-0002","fr","Ordinateur HP ProBook","Ordinateur portable professionnel"],
    ["PRD-0002","en","HP ProBook Laptop","Business Laptop"],

    ["PRD-0003","fr","Écran Dell 24 pouces","Moniteur IPS 24 pouces"],
    ["PRD-0003","en","Dell 24 Inch Monitor","24 Inch IPS Monitor"],

    ["PRD-0004","fr","Souris sans fil","Souris Logitech"],
    ["PRD-0004","en","Wireless Mouse","Logitech Mouse"],

    ["PRD-0005","fr","Clavier mécanique","Clavier RGB"],
    ["PRD-0005","en","Mechanical Keyboard","RGB Keyboard"],

    ["PRD-0006","fr","Routeur Cisco","Routeur professionnel"],
    ["PRD-0006","en","Cisco Router","Enterprise Router"],

    ["PRD-0007","fr","Commutateur réseau 24 ports","Switch Gigabit"],
    ["PRD-0007","en","24-Port Network Switch","Gigabit Switch"],

    ["PRD-0008","fr","Licence Windows 11 Pro","Licence Microsoft"],
    ["PRD-0008","en","Windows 11 Pro License","Microsoft License"],

    ["PRD-0009","fr","Microsoft Office 365","Abonnement professionnel"],
    ["PRD-0009","en","Microsoft Office 365","Business Subscription"],

    ["PRD-0010","fr","Service d'installation","Installation et configuration"],
    ["PRD-0010","en","Installation Service","Installation and Configuration"],
  ];

  for (const [reference, language, name, description] of translations) {
    const product = allProducts.find(
      (p) => p.reference === reference,
    );

    if (!product) continue;

    await prisma.productTranslation.upsert({
      where: {
        productId_language: {
          productId: product.id,
          language,
        },
      },
      update: {
        name,
        description,
      },
      create: {
        productId: product.id,
        language,
        name,
        description,
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