import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachment: string }> },
) {
  const { id, attachment } = await params;
  if (!/^[1-9]\d*$/.test(id) || !/^[1-9]\d*$/.test(attachment)) {
    return NextResponse.json({ message: "Invalid attachment reference." }, { status: 400 });
  }

  const token = request.cookies.get("helpdesk_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });

  const apiUrl = process.env.LARAVEL_API_URL;
  if (!apiUrl) return NextResponse.json({ message: "Backend API is not configured." }, { status: 500 });

  try {
    const response = await fetch(`${apiUrl}/tickets/${id}/attachments/${attachment}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Encoding": "identity",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({ message: "Unable to download this attachment." }));
      return NextResponse.json(result, { status: response.status, headers: { "Cache-Control": "private, no-store" } });
    }

    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": response.headers.get("content-disposition") ?? "attachment",
    });
    if (!response.headers.get("content-encoding") && response.headers.has("content-length")) {
      headers.set("Content-Length", response.headers.get("content-length")!);
    }
    return new NextResponse(response.body, { status: response.status, headers });
  } catch {
    return NextResponse.json({ message: "Unable to connect to Laravel." }, { status: 502 });
  }
}
