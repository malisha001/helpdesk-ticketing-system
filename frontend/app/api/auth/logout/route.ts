
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Reject requests originating from another website
  const origin = request.headers.get("origin");

  if (origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Forbidden request origin." },
      { status: 403 }
    );
  }

  // Read our HttpOnly cookie
  const token = request.cookies.get("helpdesk_token")?.value;
  const apiUrl = process.env.LARAVEL_API_URL;

  let serverRevoked = !token;

  // Revoke the token in Laravel
  if (token && apiUrl) {
    try {
      const laravelResponse = await fetch(
        `${apiUrl}/logout`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      serverRevoked =
        laravelResponse.ok ||
        laravelResponse.status === 401;
    } catch {
      serverRevoked = false;
    }
  }

  // Always clear the local browser session
  const response = NextResponse.json({
    success: true,
    serverRevoked,
    message: serverRevoked
      ? "Logged out successfully."
      : "Local session cleared, but Laravel token revocation could not be confirmed.",
  });

  response.cookies.set("helpdesk_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
