import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const p = await prisma.product.findFirst();
  const c = await prisma.customer.findFirst();
  console.log('PRODUCT_ID=' + p?.id);
  console.log('CUSTOMER_ID=' + c?.id);
  await prisma.$disconnect();
  await pool.end();
}

main();
