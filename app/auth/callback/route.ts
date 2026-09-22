import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// メール確認リンク（サインアップ確認・パスワードリセット等）からのコールバックを処理する
// code を渡された cookie ベースのセッションに交換するのはサーバー側でしかできないため Route Handler で行う
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
