'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type User, useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { getRoleName } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Mail, Phone, UserCog, LogOut } from 'lucide-react';
import { ChangePassword } from '@/components/account/change-password';

interface AccountPageProps {
  token: string;
  user: User;
  onUserUpdate: (user: User) => void;
}

export function AccountPage({ token, user, onUserUpdate }: AccountPageProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const data = await api(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      }, token);
      
      onUserUpdate(data.user);
      setIsEditing(false);
      
      toast({
        title: 'Berhasil',
        description: 'Profil berhasil diperbarui',
      });
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Akun Saya</h2>
        <p className="text-muted-foreground text-sm">Kelola profil Anda</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{getRoleName(user.role)}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  {user.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {user.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telepon</Label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {user.phone || '-'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                {getRoleName(user.role)}
              </div>
            </div>

            {isEditing ? (
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                  Batal
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            ) : (
              <Button className="w-full mt-4" onClick={() => setIsEditing(true)}>
                Edit Profil
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <ChangePassword userId={user.id} token={token} role={user.role} />

      {/* Logout Card */}
      <Card className="border-red-200">
        <CardContent className="p-4">
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="p-2 rounded-lg bg-red-50">
              <LogOut className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-600">Keluar</p>
              <p className="text-xs text-muted-foreground">Logout dari akun Anda</p>
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
