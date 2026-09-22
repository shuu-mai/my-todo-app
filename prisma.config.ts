import "dotenv/config";
import { defineConfig } from "prisma/config";

// マイグレーション（db push など）用の直接接続。Supabase ではプーラーを介さない DIRECT_URL を使う
// env() だと未設定時に prisma generate（postinstall）まで失敗するため、ここでは process.env を直接参照する
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
