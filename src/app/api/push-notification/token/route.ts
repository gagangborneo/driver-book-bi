// API: Register/Update FCM Token
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth-utils";

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  return payload?.userId || null;
}

// Register or update FCM token
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, device } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Upsert the token (update if exists, create if not)
    const fcmToken = await db.fCMToken.upsert({
      where: { token },
      update: {
        userId,
        device: device || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        device: device || null,
      },
    });

    return NextResponse.json({ success: true, fcmToken });
  } catch (error) {
    console.error("Register FCM token error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Remove FCM token (logout / unsubscribe)
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    await db.fCMToken.deleteMany({
      where: { token, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete FCM token error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
