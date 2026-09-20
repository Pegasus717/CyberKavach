import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl, hasServerSupabase } from "@/lib/env";

export async function proxy(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  let response = NextResponse.next({ request });

  if (!url || !key) {
    if (request.nextUrl.pathname.startsWith("/app")) {
      const setup = new URL("/setup", request.url);
      return NextResponse.redirect(setup);
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([header, value]) => {
          response.headers.set(header, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (path.startsWith("/app") && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if ((path === "/login" || path === "/signup") && user) {
    const dest = NextResponse.redirect(new URL("/app", request.url));
    response.cookies.getAll().forEach((cookie) => dest.cookies.set(cookie));
    return dest;
  }

  if (path.startsWith("/app") && !hasServerSupabase() && path !== "/setup") {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js).*)"],
};
