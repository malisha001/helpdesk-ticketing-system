
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // 1. Verify same-origin request
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
    );
  }

  // 2. Read Sanctum token from HttpOnly cookie
  const token = request.cookies.get("helpdesk_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  // 3. Read channel authorization data
  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { message: "Invalid request." },
      { status: 422 }
    );
  }

  const input = body as Record<string, unknown>;

  const socketId = input.socket_id;
  const channelName = input.channel_name;

  if (
    typeof socketId !== "string" ||
    !/^\d+\.\d+$/.test(socketId) ||
    typeof channelName !== "string" ||
    !/^private-App\.Models\.User\.[1-9]\d*$/.test(channelName)
  ) {
    return NextResponse.json(
      { message: "Invalid channel authorization data." },
      { status: 422 }
    );
  }

  const laravelApiUrl = process.env.LARAVEL_API_URL;

  if (!laravelApiUrl) {
    return NextResponse.json(
      { message: "Laravel API URL is not configured." },
      { status: 500 }
    );
  }

  try {
    // 4. Forward authorization to Laravel
    const response = await fetch(
      `${laravelApiUrl.replace(/\/+$/, "")}/broadcasting/auth`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channelName,
        }),
        cache: "no-store",
      }
    );

    const result = await response.json().catch(() => ({
      message: "Broadcast authorization failed.",
    }));

    return NextResponse.json(result, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Cannot connect to Laravel." },
      { status: 502 }
    );
  }
}
