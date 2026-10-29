
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const validStatuses = new Set([
  "open",
  "in_progress",
  "waiting_for_customer",
  "resolved",
]);

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  // 1. Check request origin
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
    );
  }

  // 2. Read token from HttpOnly cookie
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

  // 4. Validate request body
  const body: unknown = await request.json().catch(() => null);

  const status =
    body &&
    typeof body === "object" &&
    "status" in body
      ? body.status
      : null;

  if (
    typeof status !== "string" ||
    !validStatuses.has(status)
  ) {
    return NextResponse.json(
      { message: "Invalid ticket status." },
      { status: 422 }
    );
  }

  // 5. Read Laravel API URL
  const apiUrl = process.env.LARAVEL_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  try {
    // 6. Forward request to Laravel
    const laravelResponse = await fetch(
      `${apiUrl}/tickets/${id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
        cache: "no-store",
      }
    );

    // Handle an empty successful response
    if (laravelResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // 7. Forward Laravel's result
    const result = await laravelResponse.json().catch(
      () => ({
        message: "Unexpected response from Laravel.",
      })
    );

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
