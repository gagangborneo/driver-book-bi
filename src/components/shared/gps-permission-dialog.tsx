'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GPSPermissionDialogProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
  isLoading?: boolean;
}

export function GPSPermissionDialog({ isOpen, onAllow, onDeny, isLoading = false }: GPSPermissionDialogProps) {
  const [hasCheckedBrowser, setHasCheckedBrowser] = useState(false);

  const handleAllow = async () => {
    setHasCheckedBrowser(true);
    onAllow();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !hasCheckedBrowser && !isLoading) {
        onDeny();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Izin Akses Lokasi GPS</DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            Kami memerlukan akses ke lokasi Anda untuk merekam titik perjalanan selama pengiriman
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Why we need GPS */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">Mengapa kami memerlukan GPS?</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">📍</span>
                <span>Merekam rute perjalanan yang sebenarnya</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">✓</span>
                <span>Verifikasi lokasi pengiriman</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">📊</span>
                <span>Analisis perjalanan dan performa</span>
              </li>
            </ul>
          </div>

          {/* Privacy info */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-slate-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900 mb-1">Informasi Privasi</p>
                <p className="text-slate-600">
                  Data lokasi hanya digunakan selama perjalanan berlangsung dan disimpan aman di sistem kami.
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Catatan Penting</p>
                <p className="text-amber-800 text-xs mt-0.5">
                  Pastikan GPS semua perangkat Anda aktif untuk akurasi lokasi terbaik.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex flex-col-reverse sm:flex-row">
          <Button
            variant="outline"
            onClick={onDeny}
            disabled={isLoading}
            className="flex-1"
          >
            Tolak
          </Button>
          <Button
            className={cn(
              "flex-1",
              "bg-blue-600 hover:bg-blue-700"
            )}
            onClick={handleAllow}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Mengakses GPS...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Izinkan Akses GPS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
