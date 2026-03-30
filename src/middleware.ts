import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/sell", "/mypage", "/verify-business", "/admin", "/partners/register", "/equipment/register", "/franchise/edit"];
const roleExemptPaths = ["/select-role", "/api/", "/login", "/signup", "/forgot-password", "/reset-password", "/_next/", "/favicon"];

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

    // 역할 기반 접근 제어
    const userRole = token.role as string | undefined;
    const verified = token.verified as boolean | undefined;

    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // SELLER/FRANCHISE/PARTNER는 사업자인증 필수
    if (pathname.startsWith("/sell") && userRole !== "SELLER" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/select-role?callbackUrl=/sell", req.url));
    }

    if (pathname.startsWith("/sell") && userRole === "SELLER" && !verified) {
      return NextResponse.redirect(new URL("/verify-business?role=SELLER", req.url));
    }

    if (pathname.startsWith("/partners/register") && userRole !== "PARTNER" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/partners/register") && userRole === "PARTNER" && !verified) {
      return NextResponse.redirect(new URL("/verify-business?role=PARTNER", req.url));
    }

    if (pathname.startsWith("/equipment/register") && !["SELLER", "FRANCHISE", "PARTNER", "ADMIN"].includes(userRole || "")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/equipment/register") && ["SELLER", "FRANCHISE", "PARTNER"].includes(userRole || "") && !verified) {
      return NextResponse.redirect(new URL(`/verify-business?role=${userRole}`, req.url));
    }

    if (pathname.startsWith("/franchise/edit") && userRole !== "FRANCHISE" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 이미 로그인 된 상태에서 로그인 페이지 접근 시 홈으로
  if ((pathname === "/login" || pathname === "/signup") && token) {
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
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // CSP: 프로덕션에서만 적용 (localhost는 http라서 https-only CSP와 충돌)
  const isProduction = req.nextUrl.hostname !== "localhost";
  if (isProduction) {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.daumcdn.net https://cdn.vercel-insights.com https://*.kakao.com https://js.tosspayments.com https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "img-src 'self' data: blob: https: http:",
        "font-src 'self' data: https://cdn.jsdelivr.net",
        "connect-src 'self' https://api.tosspayments.com https://*.kakao.com https://*.pusher.com wss://*.pusher.com https://*.googleapis.com https://vitals.vercel-insights.com",
        "frame-src 'self' https://api.tosspayments.com https://js.tosspayments.com https://nid.naver.com https://kauth.kakao.com https://*.daumcdn.net https://*.daum.net https://*.kakao.com",
      ].join("; ")
    );
  }

  // 메인 페이지는 항상 최신 데이터를 보여줘야 하므로 브라우저 캐시 방지
  if (pathname === "/") {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: ["/sell/:path*", "/mypage/:path*", "/verify-business", "/login", "/signup", "/forgot-password", "/admin/:path*", "/partners/register", "/equipment/register", "/franchise/edit", "/select-role", "/"],
};
