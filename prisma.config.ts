import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// マイグレーション（db push など）用の直接接続。Supabase ではプーラーを介さない DIRECT_URL を使う
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
