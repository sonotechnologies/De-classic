import { NextResponse, type NextRequest } from "next/server";
import { BRANCH_COOKIE_NAME } from "@/lib/branch-cookie";

/** Public pages that belong to a branch. They are served from /b/[branch]/... so each branch's pages can be statically rendered. */
const BRANCH_PAGES = /^\/(?:rooms(?:\/[^/]+)?|bar|gallery|offers)?\/?$/;

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    // A cheap first gate; every admin page and action also checks the session and role on the server.
    const hasSession = SESSION_COOKIES.some((c) => request.cookies.has(c));
    if (!hasSession) return NextResponse.redirect(new URL("/admin/login", request.url));
    return NextResponse.next();
  }

  if (BRANCH_PAGES.test(pathname)) {
    const raw = request.cookies.get(BRANCH_COOKIE_NAME)?.value ?? "";
    const branch = /^[a-z0-9-]{1,60}$/.test(raw) ? raw : "_";
    const url = request.nextUrl.clone();
    url.pathname = `/b/${branch}${pathname === "/" ? "" : pathname.replace(/\/$/, "")}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/rooms/:path*", "/bar", "/gallery", "/offers", "/admin/:path*"],
};
