import { NextRequest, NextResponse } from "next/server";
import { getDataFromGitHubByCookie, saveDataToGitHubByCookie } from "@/lib/server/github";
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

  return { message: "操作失败，请稍后重试", status: 500 };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const data = await getDataFromGitHubByCookie<NavData>();
    return NextResponse.json({ data });
  } catch (error) {
    const { message, status } = sanitizeErrorMessage(error);
    if (status === 404) {
      return NextResponse.json({ data: null });
    }
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
