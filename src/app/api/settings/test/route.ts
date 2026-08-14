import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { getUserFingerspotConfig, getUserCloudId } from "@/lib/user-settings";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const fsConfig = await getUserFingerspotConfig(user.id);
    const cloudId = await getUserCloudId(user.id);

    if (!fsConfig.apiUrl || !fsConfig.apiToken || !cloudId) {
      return NextResponse.json({
        success: false,
        message: "Konfigurasi belum lengkap. Isi Fingerspot API URL, API Token, dan Cloud ID terlebih dahulu.",
      });
    }

    let baseUrl = fsConfig.apiUrl.replace(/\/+$/, "");
    if (!baseUrl.endsWith("/api")) baseUrl += "/api";
    const url = `${baseUrl}/get_device`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${fsConfig.apiToken}`,
      },
      body: JSON.stringify({ trans_id: "1", cloud_id: cloudId }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    const msg = (data as Record<string, unknown>)?.message as string | undefined;

    if (res.ok && msg !== "parameter salah") {
      return NextResponse.json({
        success: true,
        message: "Koneksi berhasil! Device ditemukan.",
      });
    }

    return NextResponse.json({
      success: false,
      message: msg || "Webhook belum ter-catch. Pastikan device online dan webhook URL sudah diatur di portal Fingerspot.",
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
