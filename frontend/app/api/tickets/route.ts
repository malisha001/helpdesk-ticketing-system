
import { NextRequest, NextResponse } from "next/server";

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

  // Forward pagination parameters
  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const perPage =
    request.nextUrl.searchParams.get("per_page") ?? "10";

  const params = new URLSearchParams({
    page,
    per_page: perPage,
  });

  try {
    const response = await fetch(
      `${apiUrl}/tickets?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to load tickets from Laravel." },
      { status: 502 }
    );
  }
}


export async function POST(request: NextRequest) {
  // 1. Reject cross-origin requests
  const origin = request.headers.get("origin");

  if (origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Forbidden request origin." },
      { status: 403 }
    );
  }

  // 2. Read authentication cookie
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

  // 3. Read and validate request body
  const body: unknown = await request.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 422 }
    );
  }

  const { subject, description, priority } = body as Record<
    string,
    unknown
  >;

  if (
    typeof subject !== "string" ||
    !subject.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    !["low", "medium", "high"].includes(String(priority))
  ) {
    return NextResponse.json(
      { message: "Please provide valid ticket details." },
      { status: 422 }
    );
  }

  try {
    // 4. Forward the request to Laravel
    const response = await fetch(`${apiUrl}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      }),
      cache: "no-store",
    });

    const result = await response.json();

    // 5. Preserve Laravel's response and status
    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to Laravel." },
      { status: 502 }
    );
  }
}

