import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId } from "@/lib/user-settings";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const cloudId = await getUserCloudId(user.id);
    const userId = user.id;

    const [usersRes, attlogsRes, webhooksRes, attlogsListRes, latestAttlogRes] = await Promise.all([
      supabaseSelect("userinfos", { count: true, limit: 1, filters: { cloud_id: `eq.${cloudId}` } }),
      supabaseSelect("attlogs", { count: true, limit: 1, filters: { cloud_id: `eq.${cloudId}` } }),
      supabaseSelect("webhook_logs", { count: true, limit: 1, filters: { cloud_id: `eq.${cloudId}` } }),
      supabaseSelect("attlogs", {
        select: "pin,name,scan_time,status_scan",
        order: { column: "scan_time", ascending: false },
        limit: 6,
        filters: { cloud_id: `eq.${cloudId}` },
      }),
      supabaseSelect("attlogs", {
        select: "cloud_id,scan_time",
        order: { column: "scan_time", ascending: false },
        limit: 1,
        filters: { cloud_id: `eq.${cloudId}` },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: usersRes.count || 0,
        totalAttlogs: attlogsRes.count || 0,
        totalWebhooks: webhooksRes.count || 0,
      },
      recentAttlogs: attlogsListRes.data || [],
      latestAttlog: latestAttlogRes.data?.[0] || null,
      cloudId,
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal memuat dashboard" }, { status: 500 });
  }
}
