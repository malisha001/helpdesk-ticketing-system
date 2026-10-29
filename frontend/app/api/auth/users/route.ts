
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 1. Read Sanctum token from HttpOnly cookie
  const token = request.cookies.get("helpdesk_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  // 2. Laravel API base URL
  const apiUrl = process.env.LARAVEL_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "Laravel API URL is not configured." },
      { status: 500 }
    );
  }

  try {
    // 3. Forward request to Laravel
    const laravelResponse = await fetch(
      `${apiUrl}/users`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    // 4. Handle Laravel response
    const result = await laravelResponse.json().catch(() => ({
      message: "Unexpected response from Laravel.",
    }));

    return NextResponse.json(result, {
      status: laravelResponse.status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to connect to Laravel." },
      { status: 502 }
    );
  }
}
