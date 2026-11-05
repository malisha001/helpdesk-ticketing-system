
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 1. Read token from HttpOnly cookie
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

  // 2. Read pagination parameters
  const page = request.nextUrl.searchParams.get("page") ?? "1";

  if (!/^[1-9]\d*$/.test(page)) {
    return NextResponse.json(
      { message: "Invalid page number." },
      { status: 422 }
    );
  }

  // 3. Build Laravel URL
  const url = new URL(`${apiUrl}/notifications`);

  url.searchParams.set("page", page);
  url.searchParams.set("per_page", "10");

  try {
    // 4. Forward request to Laravel
    const laravelResponse = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

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
      { message: "Unable to connect to Laravel." },
      { status: 502 }
    );
  }
}
