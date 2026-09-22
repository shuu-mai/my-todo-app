import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const AUTH_PAGES = ["/login", "/signup"];
// 未ログインでもアクセスを許可するパス（ログイン・登録ページ + メール確認コールバック）
const PUBLIC_PATHS = [...AUTH_PAGES, "/auth/callback"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 未ログインで公開パス以外にアクセスした場合はログインページへ
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済みでログイン・登録ページにアクセスした場合はトップへ
  if (user && AUTH_PAGES.includes(pathname)) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
