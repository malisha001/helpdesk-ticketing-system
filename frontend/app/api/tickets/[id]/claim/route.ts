
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  // 1. Verify request origin
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
    );
  }

  // 2. Get the token from the HttpOnly cookie
  const token = request.cookies.get("helpdesk_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  // 3. Validate ticket ID
  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json(
      { message: "Invalid ticket ID." },
      { status: 400 }
    );
  }

  // 4. Check Laravel configuration
  const apiUrl = process.env.LARAVEL_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  try {
    // 5. Forward the request to Laravel
    const laravelResponse = await fetch(
      `${apiUrl}/tickets/${id}/claim`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (laravelResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // 6. Forward Laravel's response
    const result = await laravelResponse.json().catch(() => ({
      message: "Unexpected response from Laravel.",
    }));

    return NextResponse.json(result, {
      status: laravelResponse.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 502 }
    );
  }
}
