import { PrismaClient } from "@prisma/client";
import { env } from "@/env";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: env.DATABASE_URL,
  }).$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (error: any) {
          console.error(`Database operation failed: ${operation} on ${model}`);
          console.error(error);
          throw error;
        }
      },
    },
  });

  // Soft connect
  client.$connect().catch((err) => {
    console.error('Failed to connect to database:', err);
  });

  return client;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

process.on('beforeExit', async () => {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
  }
});
