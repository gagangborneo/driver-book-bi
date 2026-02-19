'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Car, MapPin, Flag, Calendar, Clock, 
  Check, XCircle, History, FileText 
} from 'lucide-react';
import { RoleBadge, StatusBadgeSimple } from '@/components/shared/status-badges';
import { LoadingSkeleton } from '@/components/shared/loading';

interface AdminUsersProps {
  token: string;
}

export function AdminUsers({ token }: AdminUsersProps) {
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null);
  const [userStats, setUserStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    inProgressBookings: 0,
  });
  const [userBookings, setUserBookings] = useState<Array<Record<string, unknown>>>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE',
  });
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE',
    isActive: true,
  });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [token, filter]);

  const fetchUsers = async () => {
    try {
      const url = filter !== 'all' ? `/users?role=${filter}` : '/users';
      const data = await api(url, {}, token);
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUserDetail = async (user: Record<string, unknown>) => {
    setSelectedUser(user);
    setShowUserDetail(true);
    setIsLoadingDetail(true);
    
    try {
      const userRole = user.role as string;
      const endpoint = userRole === 'EMPLOYEE' 
        ? `/bookings?userId=${user.id}&userRole=employee`
        : `/bookings?userId=${user.id}&userRole=driver`;
      
      const data = await api(endpoint, {}, token);
      const bookings = data.bookings || [];
      
      const stats = {
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b: Record<string, unknown>) => b.status === 'PENDING').length,
        approvedBookings: bookings.filter((b: Record<string, unknown>) => b.status === 'APPROVED').length,
        completedBookings: bookings.filter((b: Record<string, unknown>) => b.status === 'COMPLETED').length,
        cancelledBookings: bookings.filter((b: Record<string, unknown>) => b.status === 'CANCELLED').length,
        inProgressBookings: bookings.filter((b: Record<string, unknown>) => 
          ['APPROVED', 'DEPARTED', 'ARRIVED', 'RETURNING'].includes(b.status as string)
        ).length,
      };
      
      setUserStats(stats);
      setUserBookings(bookings);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal memuat data user',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'User berhasil ditambahkan',
      });

      setShowAddModal(false);
      setNewUser({ name: '', email: '', phone: '', password: '', role: 'EMPLOYEE' });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      }, token);

      toast({
        title: 'Berhasil',
        description: `User telah ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async () => {
    if (!editUser.id) return;
    
    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        name: editUser.name,
        phone: editUser.phone,
        role: editUser.role,
        isActive: editUser.isActive,
      };
      
      if (editUser.password && editUser.password.trim() !== '') {
        updateData.password = editUser.password;
      }
      
      await api(`/users/${editUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'User berhasil diperbarui',
      });

      setShowEditModal(false);
      setEditUser({ id: '', name: '', email: '', phone: '', password: '', role: 'EMPLOYEE', isActive: true });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    setIsSubmitting(true);
    try {
      await api(`/users/${deleteUserId}`, {
        method: 'DELETE',
      }, token);

      toast({
        title: 'Berhasil',
        description: 'User berhasil dihapus',
      });

      setShowDeleteModal(false);
      setDeleteUserId(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: Record<string, unknown>) => {
    setEditUser({
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      phone: (user.phone as string) || '',
      password: '',
      role: user.role as string,
      isActive: user.isActive as boolean,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (userId: string) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Data User</h2>
          <p className="text-muted-foreground text-sm">Kelola pengguna sistem</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'EMPLOYEE', 'DRIVER', 'ADMIN'].map((role) => (
          <Button
            key={role}
            variant={filter === role ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(role)}
          >
            {role === 'all' ? 'Semua' : role === 'EMPLOYEE' ? 'Karyawan' : role === 'DRIVER' ? 'Driver' : 'Admin'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-3 pr-4">
            {users.map((user) => (
              <Card 
                key={user.id as string}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => handleViewUserDetail(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(user.name as string).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name as string}</p>
                        <p className="text-sm text-muted-foreground">{user.email as string}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <RoleBadge role={user.role as string} />
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(user);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(user.id as string, user.isActive as boolean);
                      }}
                    >
                      {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(user.id as string);
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Add User Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User</DialogTitle>
            <DialogDescription>
              Tambahkan pengguna baru
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Karyawan</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button onClick={handleAddUser} disabled={!newUser.name || !newUser.email || !newUser.password}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
            <DialogDescription>
              Statistik dan riwayat perjalanan
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {(selectedUser.name as string).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedUser.name as string}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email as string}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={selectedUser.role as string} />
                    <Badge variant={selectedUser.isActive ? 'default' : 'secondary'}>
                      {selectedUser.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </div>
                {selectedUser.phone ? (
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Telepon</p>
                    <p className="font-medium">{selectedUser.phone as string}</p>
                  </div>
                ) : null}
              </div>

              {/* Statistics */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Statistik Aktivitas
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">{userStats.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Total Perjalanan</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-xl">
                    <p className="text-2xl font-bold text-yellow-600">{userStats.pendingBookings}</p>
                    <p className="text-xs text-muted-foreground">Menunggu</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{userStats.completedBookings}</p>
                    <p className="text-xs text-muted-foreground">Selesai</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <p className="text-2xl font-bold text-purple-600">{userStats.inProgressBookings}</p>
                    <p className="text-xs text-muted-foreground">Berlangsung</p>
                  </div>
                  <div className="text-center p-3 bg-cyan-50 rounded-xl">
                    <p className="text-2xl font-bold text-cyan-600">{userStats.approvedBookings}</p>
                    <p className="text-xs text-muted-foreground">Disetujui</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <p className="text-2xl font-bold text-red-600">{userStats.cancelledBookings}</p>
                    <p className="text-xs text-muted-foreground">Dibatalkan</p>
                  </div>
                </div>
              </div>

              {/* Trip History */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Riwayat Perjalanan
                </h4>
                {userBookings.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <Car className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Belum ada riwayat perjalanan</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 pr-4">
                      {userBookings.map((booking) => (
                        <Card key={booking.id as string} className="border-slate-200">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {booking.status === 'COMPLETED' ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : booking.status === 'CANCELLED' ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                )}
                                <span className="font-medium text-sm">
                                  {booking.destination as string}
                                </span>
                              </div>
                              <StatusBadgeSimple status={booking.status as string} />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{booking.pickupLocation as string}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(booking.bookingDate as string).toLocaleDateString('id-ID')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{booking.bookingTime as string}</span>
                                </div>
                              </div>
                              {booking.driver ? (
                                <div className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  <span>{(booking.driver as Record<string, unknown>).name as string}</span>
                                </div>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDetail(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Perbarui data pengguna
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editUser.email}
                disabled
                className="bg-slate-100"
              />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input
                value={editUser.phone}
                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input
                type="password"
                value={editUser.password}
                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
              <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengubah password</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Karyawan</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editUser.isActive}
                onChange={(e) => setEditUser({ ...editUser, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Akun Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Batal
            </Button>
            <Button onClick={handleEditUser} disabled={!editUser.name || isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isSubmitting}>
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
