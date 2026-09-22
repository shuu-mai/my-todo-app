import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// サーバーコンポーネント / Route Handler から呼び出す Supabase クライアント
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Server Component から呼ばれた場合は Cookie を書き換えられないため無視する
          // （セッションの更新自体は proxy.ts が担当する）
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op
          }
        },
      },
    },
  );
}
