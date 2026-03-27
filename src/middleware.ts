import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/sell", "/mypage", "/verify-business", "/admin", "/partners/register"];
const roleExemptPaths = ["/select-role", "/api/", "/login", "/_next/", "/favicon"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // 보호된 경로에 비로그인 접근 시 로그인 페이지로 리다이렉트
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 이미 로그인 된 상태에서 로그인 페이지 접근 시 홈으로
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 로그인했지만 역할 미선택 시 select-role로 리다이렉트
  if (token && !roleExemptPaths.some((p) => pathname.startsWith(p))) {
    const roleSelected = token.roleSelected as boolean | undefined;
    if (!roleSelected) {
      return NextResponse.redirect(new URL("/select-role", req.url));
    }
  }

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=()");

  // 메인 페이지는 항상 최신 데이터를 보여줘야 하므로 브라우저 캐시 방지
  if (pathname === "/") {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: ["/sell/:path*", "/mypage/:path*", "/verify-business", "/login", "/admin/:path*", "/partners/register", "/select-role", "/"],
};
