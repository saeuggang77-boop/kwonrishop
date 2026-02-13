import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createClient = () => {
  const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://kwonrishop:kwonrishop_dev@localhost:5432/kwonrishop";

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

/**
 * Lazily-initialized Prisma client.
 * The real PrismaClient (and underlying pg pool) is created on first property
 * access, so the module can be imported at build time without a database.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
    }
    const value = Reflect.get(globalForPrisma.prisma, prop, receiver);
    if (typeof value === "function") {
      return value.bind(globalForPrisma.prisma);
    }
    return value;
  },
});
