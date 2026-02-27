import { NextRequest, NextResponse } from "next/server";
import { getDataFromGitHubByCookie, saveDataToGitHubByCookie } from "@/lib/server/github";
import type { NavData } from "@/lib/storage/local-storage";

export async function GET() {
  try {
    const data = await getDataFromGitHubByCookie<NavData>();
    return NextResponse.json({ data });
  } catch (error) {
    const statusCode = (error as { status?: number })?.status;
    if (statusCode === 404) {
      return NextResponse.json({ data: null });
    }
    const message = error instanceof Error ? error.message : "读取失败";
    const status = message === "未认证用户" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { data?: NavData; message?: string };
    if (!body?.data) {
      return NextResponse.json({ error: "缺少 data 参数" }, { status: 400 });
    }

    await saveDataToGitHubByCookie(body.data, body.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    const status = message === "未认证用户" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
