'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

interface ChangePasswordProps {
  userId: string;
  token: string;
}

export function ChangePassword({ userId, token }: ChangePasswordProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        title: 'Gagal',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: 'Gagal',
        description: 'Password baru harus minimal 6 karakter',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Gagal',
        description: 'Konfirmasi password tidak sesuai',
        variant: 'destructive',
      });
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast({
        title: 'Gagal',
        description: 'Password baru harus berbeda dengan password saat ini',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          password: formData.newPassword,
        }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Password berhasil diubah',
      });

      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="p-2 rounded-lg bg-blue-50">
              <Lock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-600">Ubah Password</p>
              <p className="text-xs text-muted-foreground">Perbarui password akun Anda</p>
            </div>
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Ubah Password</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Saat Ini</Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              placeholder="Masukkan password saat ini"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Masukkan password baru (minimal 6 karakter)"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Konfirmasi password baru"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsOpen(false);
                setFormData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
              }}
              disabled={isLoading}
            >
              Batalkan
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Mengubah...' : 'Ubah Password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
