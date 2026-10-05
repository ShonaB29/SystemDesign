import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // Create Category
  const category = await prisma.category.create({
    data: { name: 'Electronics' }
  });

  // Create Product
  const product = await prisma.product.create({
    data: {
      name: 'MacBook Air M4',
      brand: 'Apple',
      price: 999.00,
      categoryId: category.id
    }
  });

  // Create Inventory
  await prisma.inventory.create({
    data: {
      productId: product.id,
      availableQuantity: 100,
      reservedQuantity: 0,
      soldQuantity: 0
    }
  });

  // Create a Test Customer
  await prisma.customer.create({
    data: {
      name: 'Test Customer',
      email: 'test@example.com'
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
