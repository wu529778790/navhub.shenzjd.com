import { NextRequest, NextResponse } from "next/server";
import {
  getDataFromGitHubByCookie,
  saveDataToGitHubByCookie,
  ForkNotCreatedError,
} from "@/lib/server/github";
import { validateOrigin, checkRateLimit, getClientIP } from "@/lib/security";
import { categorySchema } from "@/lib/validation";
import type { NavData } from "@/lib/storage/local-storage";

const SANITIZED_ERRORS: Record<string, string> = {
  未认证用户: "未认证用户",
};

function sanitizeErrorMessage(error: unknown): { message: string; status: number } {
  if (!(error instanceof Error)) {
    return { message: "操作失败", status: 500 };
  }

  if ((error as { status?: number }).status === 404) {
    return { message: "数据不存在", status: 404 };
  }

  const knownMessage = SANITIZED_ERRORS[error.message];
  if (knownMessage) {
    return { message: knownMessage, status: 401 };
  }

  // 透传已知 fork 相关的语义化错误——禁止吞掉，否则用户看不到 fork 失败原因
  if (error.name === "ForkCreateError" || error.name === "ForkNotReadyError") {
    return { message: error.message, status: (error as { status?: number }).status ?? 500 };
  }

  return { message: "操作失败，请稍后重试", status: 500 };
}

export async function GET(request: NextRequest) {
  try {
    // 为 GET 路由添加基本的 rate limiting（防止 CSRF 攻击消耗 API 配额）
    const clientIP = getClientIP(request);
    // GET 读取请求使用较宽松的限制：每分钟 30 次
    const rateLimit = checkRateLimit(clientIP, 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
      );
    }

    try {
      const data = await getDataFromGitHubByCookie<NavData>();
      return NextResponse.json({ data, forkExists: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof ForkNotCreatedError) {
        // 404 fork 仓库不存在 → 明确告诉前端
        return NextResponse.json(
          { data: null, forkExists: false, message: "fork-not-created" },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      throw error;
    }
  } catch (error) {
    const { message, status } = sanitizeErrorMessage(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth + Origin check before parsing body
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "非法请求来源" }, { status: 403 });
    }

    const body = (await request.json()) as { data?: NavData; message?: string };
    if (!body?.data) {
      return NextResponse.json({ error: "缺少 data 参数" }, { status: 400 });
    }

    // Validate each category with Zod
    const validatedCategories = body.data.categories.map((cat) => categorySchema.parse(cat));

    await saveDataToGitHubByCookie({ ...body.data, categories: validatedCategories }, body.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "数据格式无效" }, { status: 400 });
    }
    const { message, status } = sanitizeErrorMessage(error);
    return NextResponse.json({ error: message }, { status });
  }
}
