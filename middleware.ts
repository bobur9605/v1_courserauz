import createMiddleware from "next-intl/middleware";
import { jwtVerify } from "jose/jwt/verify";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const PROTECTED_PREFIXES = ["/dashboard", "/teacher", "/force-change-password"];
const ADMIN_PREFIXES = ["/admin"];

function pathnameWithoutLocale(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments[0] &&
    routing.locales.includes(segments[0] as (typeof routing.locales)[number])
  ) {
    return "/" + segments.slice(1).join("/");
  }
  return pathname || "/";
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const bare = pathnameWithoutLocale(pathname);

  const token = req.cookies.get("wdedu_session")?.value;
  const needsAssignmentAuth =
    bare.startsWith("/courses/") && bare.includes("/assignment/");
  const needsAuth =
    PROTECTED_PREFIXES.some((p) => bare.startsWith(p)) || needsAssignmentAuth;
  const needsAdmin = ADMIN_PREFIXES.some((p) => bare.startsWith(p));

  const url = req.nextUrl.clone();
  const localeMatch = pathname.match(new RegExp(`^/(${routing.locales.join("|")})(/|$)`));
  const currentLocale = localeMatch?.[1] ?? routing.defaultLocale;
  const loginPath =
    currentLocale === routing.defaultLocale ? "/login" : `/${currentLocale}/login`;
  const forceChangePath =
    currentLocale === routing.defaultLocale
      ? "/force-change-password"
      : `/${currentLocale}/force-change-password`;

  if (needsAuth || needsAdmin) {
    if (!token) {
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }
    if (!process.env.JWT_SECRET) {
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET),
      );
      if (
        payload.mustChangePassword === true &&
        bare !== "/force-change-password"
      ) {
        url.pathname = forceChangePath;
        return NextResponse.redirect(url);
      }
      if (needsAdmin && payload.role !== "SUPERADMIN") {
        const dash =
          currentLocale === routing.defaultLocale
            ? "/dashboard"
            : `/${currentLocale}/dashboard`;
        url.pathname = dash;
        return NextResponse.redirect(url);
      }
      const onTeacher = bare.startsWith("/teacher");
      if (
        onTeacher &&
        payload.role !== "TEACHER" &&
        payload.role !== "SUPERADMIN"
      ) {
        const dash =
          currentLocale === routing.defaultLocale
            ? "/dashboard"
            : `/${currentLocale}/dashboard`;
        url.pathname = dash;
        return NextResponse.redirect(url);
      }
    } catch {
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }
  }

  return intl(req);
}

export const config = {
  matcher: ["/", "/(uz|en|ru)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
