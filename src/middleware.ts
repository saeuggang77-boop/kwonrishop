import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Static/SEO files - always public
  if (
    pathname === "/api/health" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest"
  ) {
    return NextResponse.next();
  }

  // Public routes
  const publicPaths = ["/", "/login", "/register", "/verify", "/listings", "/legal", "/premium"];
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    (pathname.startsWith("/api/listings") && req.method === "GET") ||
    pathname.startsWith("/api/events");

  // CRON routes - secured by secret
  if (pathname.startsWith("/api/cron")) {
    const cronSecret = req.headers.get("authorization")?.replace("Bearer ", "");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // TossPayments webhook
  if (pathname === "/api/payments/webhook") {
    return NextResponse.next();
  }

  // Public paths don't require auth
  if (isPublicPath || isPublicApi) {
    return NextResponse.next();
  }

  // Everything else requires authentication
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (userRole !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Dashboard routes - BUYER can access notifications, inquiries, reports
  if (pathname.startsWith("/dashboard")) {
    const buyerAllowedPaths = ["/dashboard/notifications", "/dashboard/inquiries", "/dashboard/reports"];
    const isBuyerAllowed = buyerAllowedPaths.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );

    if (!isBuyerAllowed && userRole !== "SELLER" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/notifications", req.url));
    }
  }

  // Seller API routes
  if (pathname.startsWith("/api/seller")) {
    if (userRole !== "SELLER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "판매자 전용 기능입니다." }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|logos|favicon.ico).*)"],
};
