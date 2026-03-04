"use client";

import { useAuthStore } from "@/lib/auth-store";
import AdminPushNotificationSettings from "@/components/admin/admin-push-notification-settings";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function PushNotificationPage() {
  const { token } = useAuthStore();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle>Push Notification</CardTitle>
              <CardDescription>
                Kelola pengaturan Firebase Push Notification untuk sistem SI-LAMIN
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <AdminPushNotificationSettings token={token || ""} />
    </div>
  );
}
