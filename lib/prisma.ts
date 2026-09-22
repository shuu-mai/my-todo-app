import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// アプリからのクエリはプーラー経由の DATABASE_URL を使う（DIRECT_URL は migrate 専用）
const adapter = new PrismaPg(process.env.DATABASE_URL!);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// 開発時のホットリロードでクライアントが増殖しないようグローバルにキャッシュする
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
