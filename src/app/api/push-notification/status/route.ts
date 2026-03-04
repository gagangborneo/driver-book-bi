// API: Push Notification Status (for any authenticated user)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth-utils";

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  return payload?.userId || null;
}

// Check if push notification is enabled (for client)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const config = await db.pushNotificationConfig.findFirst();
      const isActive = config?.isActive ?? false;
      return NextResponse.json({ isActive });
    } catch {
      // Table might not exist yet or other DB error - just return false
      return NextResponse.json({ isActive: false });
    }
  } catch (error) {
    console.error("Get push notification status error:", error);
    return NextResponse.json({ isActive: false });
  }
}
