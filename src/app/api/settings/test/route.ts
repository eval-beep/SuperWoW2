import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { getUserFingerspotConfig, getUserCloudId } from "@/lib/user-settings";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const fsConfig = await getUserFingerspotConfig(user.id);
    const cloudId = await getUserCloudId(user.id);

    const url = `${fsConfig.apiUrl}/get_device`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${fsConfig.apiToken}`,
      },
      body: JSON.stringify({ cloud_id: cloudId }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    if (res.ok && (data as Record<string, unknown>)?.success !== false) {
      return NextResponse.json({
        success: true,
        message: "Koneksi berhasil! Device ditemukan.",
      });
    }

    return NextResponse.json({
      success: false,
      message: data?.message || data?.error || "Device tidak ditemukan atau tidak aktif",
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      success: false,
      message: "Gagal menghubungi server Fingerspot",
    });
  }
}
