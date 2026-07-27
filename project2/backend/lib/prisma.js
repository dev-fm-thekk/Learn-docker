import { PrismaClient } from '@prisma/client';

// Singleton pattern — reuse the same PrismaClient instance across the app
const prisma = new PrismaClient();

export default prisma;
