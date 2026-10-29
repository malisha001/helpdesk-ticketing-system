import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get login credentials from frontend
    const body = await request.json();

    if (
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      !body.email ||
      !body.password
    ) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 422 }
      );
    }

    // Send login request to Laravel
    const laravelResponse = await fetch(
      `${process.env.LARAVEL_API_URL}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
        }),
        cache: "no-store",
      }
    );

    const result = await laravelResponse.json();

    // Handle failed login
    if (!laravelResponse.ok) {
      return NextResponse.json(
        {
          message:
            laravelResponse.status === 401
              ? "Invalid email or password."
              : "Unable to log in. Please check your details.",
        },
        {
          status: laravelResponse.status === 401 ? 401 : 422,
        }
      );
    }

    // Extract token from Laravel response
    const data = result.data ?? result;
    const token = data.token;

    if (typeof token !== "string" || !token) {
      return NextResponse.json(
        { message: "Invalid login response from backend." },
        { status: 502 }
      );
    }

    // Create frontend response
    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
    });

    // Store token in HttpOnly cookie
    response.cookies.set("helpdesk_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the login service." },
      { status: 502 }
    );
  }
}
