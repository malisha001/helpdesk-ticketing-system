import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
    );
  }

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

  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 422 }
    );
  }

  const { name, email } = body as Record<string, unknown>;
  const errors: Record<string, string[]> = {};

  if (typeof name !== "string" || !name.trim()) {
    errors.name = ["The name field is required."];
  } else if (name.trim().length > 255) {
    errors.name = ["The name must not exceed 255 characters."];
  }

  if (typeof email !== "string" || !email.trim()) {
    errors.email = ["The email field is required."];
  } else if (email.trim().length > 255) {
    errors.email = ["The email must not exceed 255 characters."];
  }

  if (Object.keys(body).some((key) => key !== "name" && key !== "email")) {
    return NextResponse.json(
      { message: "Only name and email can be provided when creating a support agent." },
      { status: 422 }
    );
  }

  if (typeof name !== "string" || typeof email !== "string" || Object.keys(errors).length > 0) {
    return NextResponse.json(
      { message: "Please correct the highlighted fields.", errors },
      { status: 422 }
    );
  }

  try {
    // Reuse the existing Laravel agent-creation endpoint and request contract.
    const response = await fetch(`${apiUrl.replace(/\/+$/, "")}/users/agents`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      cache: "no-store",
    });

    const result = await response.json().catch(() => ({
      message: "Unexpected response from Laravel.",
    }));

    return NextResponse.json(result, {
      status: response.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to Laravel." },
      { status: 502 }
    );
  }
}
