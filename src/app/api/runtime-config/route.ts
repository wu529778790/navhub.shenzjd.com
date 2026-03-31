import { NextResponse } from "next/server";
import { getServerRuntimePublicConfig } from "@/lib/runtime-public-config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getServerRuntimePublicConfig(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
