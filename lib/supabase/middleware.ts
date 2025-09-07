import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isAdmin } from "../permissions";
import { Database } from "@/types/database.types";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/bli-stylist",
  "/kontakt",
  "/om-oss",
  "/tjenester",
  "/privacy",
  "/terms-of-service",
  "/faq",
  "/handlekurv", // Allow viewing cart without authentication
  "/manifest.json", // PWA manifest file
  "/sitemap.xml", // SEO sitemap
  "/robots.txt", // SEO robots file
];

// Define route patterns for dynamic public routes
const publicRoutePatterns = [
  /^\/auth(\/.*)?$/, // /auth and all sub-routes
  /^\/tjenester\/[^/]+$/, // /tjenester/[id]
  /^\/profiler\/[^/]+$/, // /profiler/[profileId]
  /^\/api\/cron(\/.*)?$/, // /api/cron and all sub-routes (for Vercel cron jobs)
  /^\/api\/dev(\/.*)?$/, // /api/dev and all sub-routes (for dev tool testing)
];

function isPublicRoute(pathname: string): boolean {
  // Check exact matches first
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // Check pattern matches
  return publicRoutePatterns.some((pattern) => pattern.test(pathname));
}

export async function updateSession(
  request: NextRequest,
  response?: NextResponse,
) {
  // Handle affiliate code tracking first
  const url = request.nextUrl.clone();
  const affiliateCode = url.searchParams.get("code");

  let supabaseResponse = response || NextResponse.next({
    request,
  });

  if (affiliateCode && !response) {
    // Import here to avoid circular dependencies
    const { createAffiliateAttributionCookie } = await import("@/types");

    // Create response to redirect and remove the code parameter from URL
    supabaseResponse = NextResponse.redirect(url.origin + url.pathname);

    // Create typed affiliate attribution cookie
    const attribution = createAffiliateAttributionCookie(affiliateCode);

    supabaseResponse.cookies.set(
      "affiliate_attribution",
      JSON.stringify(attribution),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
        path: "/",
      },
    );
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          console.log("🍪 Supabase setting cookies:", cookiesToSet.map(c => c.name));
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Transfer affiliate attribution from cookie to database for logged-in users
  if (user?.sub) {
    console.log("🔐 User authenticated, attempting to transfer affiliate attribution:", user.sub);
    try {
      const { transferCookieToDatabase } = await import(
        "@/server/affiliate/affiliate-attribution.actions"
      );
      const result = await transferCookieToDatabase(user.sub);
      console.log("🔄 Transfer result:", result);
      
      if (result.shouldDeleteCookie) {
        console.log("🗑️ Deleting affiliate attribution cookie from middleware");
        supabaseResponse.cookies.delete("affiliate_attribution");
      }
      
      console.log("✅ Affiliate attribution transfer completed");
    } catch (error) {
      console.warn("❌ Failed to transfer affiliate attribution:", error);
      // Don't block the request if affiliate transfer fails
    }
  } else {
    console.log("👤 No authenticated user found");
  }

  // Check if the current route is public
  const isPublic = isPublicRoute(request.nextUrl.pathname);

  // Only redirect to login if the route is not public and user is not authenticated
  if (!isPublic && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Check if the route requires admin access
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && user) {
    // Get user's profile to check their role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.sub)
      .single();

    if (!profile || !isAdmin(profile.role)) {
      // Redirect to unauthorized page or dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
