
import { NextRequest, NextResponse } from "next/server";
import { normalizeMeResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("helpdesk_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  const apiUrl = process.env.LARAVEL_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  try {
    const laravelResponse = await fetch(`${apiUrl}/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    // Handle invalid or rejected sessions
    if (
      laravelResponse.status === 401 ||
      laravelResponse.status === 403
    ) {
      const response = NextResponse.json(
        { message: "Session expired or access denied." },
        { status: laravelResponse.status }
      );

      // Remove the invalid local session cookie
      response.cookies.set("helpdesk_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    if (!laravelResponse.ok) {
      return NextResponse.json(
        { message: "Failed to retrieve user details." },
        { status: laravelResponse.status }
      );
    }

    const result: unknown = await laravelResponse.json();

    // Reuse the same normalization as getCurrentUser()
    const user = normalizeMeResponse(result);

    return NextResponse.json(user, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to verify the user session." },
      { status: 502 }
    );
  }
}
