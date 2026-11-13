import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const targetUrl = new URL("health", BACKEND_URL.endsWith("/") ? BACKEND_URL : `${BACKEND_URL}/`);
    const res = await fetch(targetUrl, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ status: "error", error: "Backend unhealthy" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { status: "offline", error: error instanceof Error ? error.message : "Backend unreachable" },
      { status: 503 }
    );
  }
}
