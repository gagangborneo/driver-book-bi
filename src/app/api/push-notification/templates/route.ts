// API: Push Notification Templates (Admin only) - List & Create
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth-utils";

function getUserFromToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  return verifyToken(token);
}

// Get all templates
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

    let templates = await db.pushNotificationTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Seed default templates if none exist
    if (templates.length === 0) {
      const defaults = [
        {
          name: "NEW_BOOKING",
          type: "NEW_BOOKING",
          title: "📋 Pesanan Baru!",
          body: "{employee_name} memesan perjalanan dari {pickup} ke {destination} pukul {time}. Segera terima pesanan!",
          isActive: true,
        },
        {
          name: "BOOKING_ACCEPTED",
          type: "BOOKING_ACCEPTED",
          title: "✅ Driver Menerima Pesanan",
          body: "Driver {driver_name} telah menerima pesanan perjalanan Anda dari {pickup} ke {destination}.",
          isActive: true,
        },
        {
          name: "BOOKING_COMPLETED",
          type: "BOOKING_COMPLETED",
          title: "🏁 Perjalanan Selesai",
          body: "Perjalanan Anda dari {pickup} ke {destination} bersama {driver_name} telah selesai. Silakan beri rating perjalanan Anda.",
          isActive: true,
        },
      ];

      for (const tpl of defaults) {
        await db.pushNotificationTemplate.create({ data: tpl });
      }

      templates = await db.pushNotificationTemplate.findMany({
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get push notification templates error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Create a new template
export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromToken(request.headers.get("authorization"));
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, type, title, body, isActive } = await request.json();

    if (!name || !type || !title || !body) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const template = await db.pushNotificationTemplate.create({
      data: {
        name,
        type,
        title,
        body,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Create push notification template error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
