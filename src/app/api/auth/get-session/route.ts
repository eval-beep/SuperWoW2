import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}
