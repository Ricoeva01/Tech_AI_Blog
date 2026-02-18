import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function proxy(request) {
  const authCheckUrl = new URL("/api/auth/validateSession", request.url);
  const authResponse = await fetch(authCheckUrl, {
    headers: {
      cookie: (await cookies()).toString(),
    },
    cache: "force-cache",
    next: { tags: ["auth-session"] },
  });
  const { authorized } = await authResponse.json();
  if (!authorized) {
    return NextResponse.redirect(new URL("/signin", request.url));
  } else {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/profile"],
};

// const privateRoutes = ["/dashboard", "/dashboard/create"];

// export function middleware(request) {
//   const sessionCookie = request.cookies.get("sessionId");
//   const { pathname } = request.nextUrl;

//   const isPrivateRoute = privateRoutes.some(
//     (route) => pathname === route || pathname.startsWith(route + "/"),
//   );

//   // If the user is trying to access a private route without a session, redirect to signin
//   if (isPrivateRoute && !sessionCookie) {
//     return NextResponse.redirect(new URL("/signin", request.url));
//   }

//   return NextResponse.next();
// }

// // See "Matching Paths" below to learn more
// export const config = {
//   matcher: ["/dashboard/:path*", "/signin", "/signup"],
// };

// export async function isPrivatePage(pathname) {
//   const privateSegments = ["/dashboard", "/settings/profile"];
//   return privateSegments.some(
//     (segment) => pathname === segment || pathname.startsWith(segment + "/"),
//   );
// }
