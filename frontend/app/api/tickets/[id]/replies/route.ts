
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  // 1. Check that the request comes from our own frontend
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
    );
  }

  // 2. Read the existing HttpOnly authentication cookie
  const token = request.cookies.get("helpdesk_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  // 3. Get the ticket ID
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { message: "Invalid ticket ID." },
      { status: 400 }
    );
  }

  // 4. Validate the incoming message
  const body: unknown = await request.json().catch(() => null);

  const message =
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message) {
    return NextResponse.json(
      { message: "Reply message is required." },
      { status: 422 }
    );
  }

  // 5. Get Laravel API configuration
  const apiUrl = process.env.LARAVEL_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  try {
    // 6. Forward the reply to Laravel
    const laravelResponse = await fetch(
      `${apiUrl}/tickets/${id}/replies`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
        cache: "no-store",
      }
    );

    // 7. Preserve Laravel's response and status
    if (laravelResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const result = await laravelResponse
      .json()
      .catch(() => ({
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
