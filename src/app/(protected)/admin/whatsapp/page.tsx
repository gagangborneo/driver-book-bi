'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AdminWhatsAppSettings } from '@/components/admin/admin-whatsapp-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function AdminWhatsAppPage() {
  const { token } = useAuthStore();
  const router = useRouter();

  if (!token) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <Card className="border-b">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle>WhatsApp Settings</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configure WhatsApp integration, routes, and message templates
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <AdminWhatsAppSettings token={token} />
    </div>
  );
}
