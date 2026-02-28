'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Car, User, Plus } from 'lucide-react';
import { StatusBadgeVehicle } from '@/components/shared/status-badges';
import { LoadingSkeleton } from '@/components/shared/loading';

interface AdminVehiclesProps {
  token: string;
}

export function AdminVehicles({ token }: AdminVehiclesProps) {
  const [vehicles, setVehicles] = useState<Array<Record<string, unknown>>>([]);
  const [drivers, setDrivers] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: '',
    brand: '',
    model: '',
    year: '',
    color: '',
  });
  const [editVehicle, setEditVehicle] = useState({
    id: '',
    plateNumber: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    status: 'AVAILABLE',
    assignedToId: '__none__',
  });
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, [token]);

  const fetchDrivers = async () => {
    try {
      const data = await api('/users?role=DRIVER', {}, token);
      setDrivers(data.users || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await api('/vehicles', {}, token);
      setVehicles(data.vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    setIsSubmitting(true);
    try {
      await api('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          ...newVehicle,
          year: parseInt(newVehicle.year),
        }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Kendaraan berhasil ditambahkan',
      });

      setShowAddModal(false);
      setNewVehicle({ plateNumber: '', brand: '', model: '', year: '', color: '' });
      fetchVehicles();
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

  const handleEditVehicle = async () => {
    if (!editVehicle.id) return;
    
    setIsSubmitting(true);
    try {
      await api(`/vehicles/${editVehicle.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          plateNumber: editVehicle.plateNumber,
          brand: editVehicle.brand,
          model: editVehicle.model,
          year: parseInt(editVehicle.year),
          color: editVehicle.color,
          status: editVehicle.status,
          assignedToId: editVehicle.assignedToId === '__none__' ? null : editVehicle.assignedToId || null,
        }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Kendaraan berhasil diperbarui',
      });

      setShowEditModal(false);
      setEditVehicle({ id: '', plateNumber: '', brand: '', model: '', year: '', color: '', status: 'AVAILABLE', assignedToId: '__none__' });
      fetchVehicles();
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

  const handleDeleteVehicle = async () => {
    if (!deleteVehicleId) return;
    
    setIsSubmitting(true);
    try {
      await api(`/vehicles/${deleteVehicleId}`, {
        method: 'DELETE',
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Kendaraan berhasil dihapus',
      });

      setShowDeleteModal(false);
      setDeleteVehicleId(null);
      fetchVehicles();
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

  const openEditModal = (vehicle: Record<string, unknown>) => {
    setEditVehicle({
      id: vehicle.id as string,
      plateNumber: vehicle.plateNumber as string,
      brand: vehicle.brand as string,
      model: vehicle.model as string,
      year: (vehicle.year as number).toString(),
      color: vehicle.color as string,
      status: vehicle.status as string,
      assignedToId: (vehicle.assignedTo as Record<string, unknown>)?.id as string || '__none__',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (vehicleId: string) => {
    setDeleteVehicleId(vehicleId);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Data Kendaraan</h2>
          <p className="text-muted-foreground text-sm">Kelola armada kendaraan</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id as string}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <Car className="h-6 w-6 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{vehicle.plateNumber as string}</p>
                        <StatusBadgeVehicle status={vehicle.status as string} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand as string} {vehicle.model as string} ({vehicle.year as number})
                      </p>
                      <p className="text-sm text-muted-foreground">Warna: {vehicle.color as string}</p>
                      {vehicle.assignedTo ? (
                        <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{(vehicle.assignedTo as Record<string, unknown>).name as string}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(vehicle)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(vehicle.id as string)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      )}

      {/* Add Vehicle Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kendaraan</DialogTitle>
            <DialogDescription>
              Tambahkan kendaraan baru
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor Plat</Label>
              <Input
                value={newVehicle.plateNumber}
                onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                placeholder="B 1234 BI"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Merk</Label>
                <Input
                  value={newVehicle.brand}
                  onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  placeholder="Innova"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Warna</Label>
                <Input
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                  placeholder="Hitam"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button onClick={handleAddVehicle} disabled={!newVehicle.plateNumber || !newVehicle.brand || !newVehicle.model || isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kendaraan</DialogTitle>
            <DialogDescription>
              Perbarui data kendaraan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor Plat</Label>
              <Input
                value={editVehicle.plateNumber}
                onChange={(e) => setEditVehicle({ ...editVehicle, plateNumber: e.target.value })}
                placeholder="B 1234 BI"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Merk</Label>
                <Input
                  value={editVehicle.brand}
                  onChange={(e) => setEditVehicle({ ...editVehicle, brand: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={editVehicle.model}
                  onChange={(e) => setEditVehicle({ ...editVehicle, model: e.target.value })}
                  placeholder="Innova"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Input
                  type="number"
                  value={editVehicle.year}
                  onChange={(e) => setEditVehicle({ ...editVehicle, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Warna</Label>
                <Input
                  value={editVehicle.color}
                  onChange={(e) => setEditVehicle({ ...editVehicle, color: e.target.value })}
                  placeholder="Hitam"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editVehicle.status} onValueChange={(value) => setEditVehicle({ ...editVehicle, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Tersedia</SelectItem>
                  <SelectItem value="IN_USE">Digunakan</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Driver Assigned</Label>
              <Select value={editVehicle.assignedToId} onValueChange={(value) => setEditVehicle({ ...editVehicle, assignedToId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih driver (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tidak ada</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id as string} value={driver.id as string}>
                      {driver.name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Batal
            </Button>
            <Button onClick={handleEditVehicle} disabled={!editVehicle.plateNumber || !editVehicle.brand || !editVehicle.model || isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vehicle Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kendaraan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kendaraan ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteVehicle} disabled={isSubmitting}>
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
