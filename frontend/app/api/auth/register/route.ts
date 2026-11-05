import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
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

  const allowedFields = ["name", "email", "password", "password_confirmation"];

  if (Object.keys(body).some((key) => !allowedFields.includes(key))) {
    return NextResponse.json(
      { message: "Only name, email, password, and password confirmation can be provided." },
      { status: 422 }
    );
  }

  const { name, email, password, password_confirmation } = body as Record<string, unknown>;
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

  if (typeof password !== "string" || !password) {
    errors.password = ["The password field is required."];
  }

  if (typeof password_confirmation !== "string" || !password_confirmation) {
    errors.password_confirmation = ["Please confirm your password."];
  } else if (password_confirmation !== password) {
    errors.password_confirmation = ["The passwords do not match."];
  }

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    Object.keys(errors).length > 0
  ) {
    return NextResponse.json(
      { message: "Please correct the highlighted fields.", errors },
      { status: 422 }
    );
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/+$/, "")}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Laravel's existing contract accepts these three fields only.
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      cache: "no-store",
    });

    const result = await response.json().catch(() => null);

    if (!result || typeof result !== "object") {
      return NextResponse.json(
        { message: "Unexpected response from Laravel." },
        { status: 502 }
      );
    }

    return NextResponse.json(result, {
      status: response.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the registration service." },
      { status: 502 }
    );
  }
}
