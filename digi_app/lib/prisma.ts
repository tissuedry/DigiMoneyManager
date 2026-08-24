import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg'; 

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function makePrisma() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ 
    adapter, 
    log: process.env.NODE_ENV === 'production' 
    ? ['error'] 
    : ['query', 'error', 'warn'] 
  });
}

export const prisma = globalForPrisma.prisma || makePrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;