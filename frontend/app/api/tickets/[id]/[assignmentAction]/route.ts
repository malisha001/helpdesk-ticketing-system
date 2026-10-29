
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
    assignmentAction: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id, assignmentAction } = await params;

  // Only these two actions are supported
  if (
    assignmentAction !== "assign" &&
    assignmentAction !== "reassign"
  ) {
    return NextResponse.json(
      { message: "Action not found." },
      { status: 404 }
    );
  }

  // Check request origin
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
    );
  }

  // Read existing authentication cookie
  const token = request.cookies.get("helpdesk_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  // Validate ticket ID
  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json(
      { message: "Invalid ticket ID." },
      { status: 400 }
    );
  }

  // Read and validate the agent ID
  const body: unknown = await request.json().catch(() => null);

  const agentId =
    body && typeof body === "object" && "agent_id" in body
      ? body.agent_id
      : null;

  if (
    typeof agentId !== "number" ||
    !Number.isSafeInteger(agentId) ||
    agentId <= 0
  ) {
    return NextResponse.json(
      { message: "A valid agent ID is required." },
      { status: 422 }
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
    const response = await fetch(
      `${apiUrl}/tickets/${id}/${assignmentAction}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId,
        }),
        cache: "no-store",
      }
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const result = await response.json().catch(() => ({
      message: "Unexpected response from Laravel.",
    }));

    return NextResponse.json(result, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to Laravel." },
      { status: 502 }
    );
  }
}
