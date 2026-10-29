
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  // Validate the ticket ID
  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json(
      { message: "Invalid ticket ID." },
      { status: 400 }
    );
  }

  // Read the authentication token
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
    // Forward the request to Laravel
    const response = await fetch(
      `${apiUrl}/tickets/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to load ticket details." },
      { status: 502 }
    );
  }
}
