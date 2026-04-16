import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const listings = await prisma.listing.findMany({
    include: { subCategory: true, category: true },
  });

  console.log(`총 ${listings.length}개 매물`);
  console.log("");
  for (const l of listings) {
    const storeName = (l as { storeName?: string }).storeName ?? "(이름없음)";
    const sub = l.subCategory?.name ?? "null";
    const cat = l.category?.name ?? "null";
    const tag = sub === "null" && cat === "null" ? " ⚠️" : "";
    console.log(`  ${l.id.slice(-6)} | ${storeName.padEnd(25)} | cat:${cat.padEnd(12)} sub:${sub}${tag}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
