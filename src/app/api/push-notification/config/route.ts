// API: Push Notification Config (Admin only)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth-utils";

function getUserFromToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  return verifyToken(token);
}

// Get push notification config
export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromToken(request.headers.get("authorization"));
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let config = await db.pushNotificationConfig.findFirst();

    // Create default config if none exists
    if (!config) {
      config = await db.pushNotificationConfig.create({
        data: { isActive: false },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Get push notification config error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Update push notification config (toggle on/off)
export async function PUT(request: NextRequest) {
  try {
    const payload = getUserFromToken(request.headers.get("authorization"));
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { isActive } = await request.json();

    let config = await db.pushNotificationConfig.findFirst();

    if (config) {
      config = await db.pushNotificationConfig.update({
        where: { id: config.id },
        data: { isActive: isActive ?? false },
      });
    } else {
      config = await db.pushNotificationConfig.create({
        data: { isActive: isActive ?? false },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Update push notification config error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
