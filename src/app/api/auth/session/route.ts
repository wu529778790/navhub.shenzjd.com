import { NextResponse } from "next/server";
import { getAuthenticatedUserFromCookie, getTokenFromCookie } from "@/lib/server/github";

export async function GET() {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const user = await getAuthenticatedUserFromCookie();
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
