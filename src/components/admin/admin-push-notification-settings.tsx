"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  BellOff,
  Edit,
  Trash2,
  Plus,
  Save,
  Info,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface PushConfig {
  id: string;
  isActive: boolean;
}

interface PushTemplate {
  id: string;
  name: string;
  type: string;
  title: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTIFICATION_TYPES = [
  {
    value: "NEW_BOOKING",
    label: "Pesanan Baru",
    description: "Dikirim ke semua driver yang tersedia saat karyawan membuat pesanan baru",
    icon: "📋",
  },
  {
    value: "BOOKING_ACCEPTED",
    label: "Pesanan Diterima",
    description: "Dikirim ke karyawan saat driver menerima pesanan",
    icon: "✅",
  },
  {
    value: "BOOKING_COMPLETED",
    label: "Perjalanan Selesai",
    description: "Dikirim ke karyawan saat perjalanan selesai untuk memberi rating",
    icon: "🏁",
  },
];

const PLACEHOLDERS = [
  { key: "{employee_name}", desc: "Nama karyawan" },
  { key: "{driver_name}", desc: "Nama driver" },
  { key: "{pickup}", desc: "Lokasi jemput" },
  { key: "{destination}", desc: "Tujuan" },
  { key: "{time}", desc: "Waktu perjalanan" },
  { key: "{booking_id}", desc: "ID booking" },
];

export default function AdminPushNotificationSettings({ token }: { token: string }) {
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [templates, setTemplates] = useState<PushTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PushTemplate | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state for editing
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("NEW_BOOKING");
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, templatesRes] = await Promise.all([
        api("/push-notification/config", {}, token),
        api("/push-notification/templates", {}, token),
      ]);
      setConfig(configRes.config);
      setTemplates(templatesRes.templates);
    } catch (error) {
      console.error("Error fetching push notification data:", error);
      toast.error("Gagal memuat data push notification");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePushNotification = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await api("/push-notification/config", {
        method: "PUT",
        body: JSON.stringify({ isActive: !config.isActive }),
      }, token);
      setConfig(res.config);
      toast.success(
        res.config.isActive
          ? "Push Notification diaktifkan"
          : "Push Notification dinonaktifkan"
      );
    } catch (error) {
      console.error("Error toggling push notification:", error);
      toast.error("Gagal mengubah pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (template?: PushTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormName(template.name);
      setFormType(template.type);
      setFormTitle(template.title);
      setFormBody(template.body);
      setFormIsActive(template.isActive);
    } else {
      setEditingTemplate(null);
      setFormName("");
      setFormType("NEW_BOOKING");
      setFormTitle("");
      setFormBody("");
      setFormIsActive(true);
    }
    setShowEditDialog(true);
  };

  const saveTemplate = async () => {
    if (!formName || !formType || !formTitle || !formBody) {
      toast.error("Semua field wajib diisi");
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        // Update existing
        const res = await api(`/push-notification/templates/${editingTemplate.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formName,
            type: formType,
            title: formTitle,
            body: formBody,
            isActive: formIsActive,
          }),
        }, token);
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingTemplate.id ? res.template : t))
        );
        toast.success("Template berhasil diperbarui");
      } else {
        // Create new
        const res = await api("/push-notification/templates", {
          method: "POST",
          body: JSON.stringify({
            name: formName,
            type: formType,
            title: formTitle,
            body: formBody,
            isActive: formIsActive,
          }),
        }, token);
        setTemplates((prev) => [...prev, res.template]);
        toast.success("Template berhasil dibuat");
      }
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Gagal menyimpan template");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      await api(`/push-notification/templates/${deletingId}`, {
        method: "DELETE",
      }, token);
      setTemplates((prev) => prev.filter((t) => t.id !== deletingId));
      toast.success("Template berhasil dihapus");
      setShowDeleteDialog(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Gagal menghapus template");
    } finally {
      setSaving(false);
    }
  };

  const getTypeInfo = (type: string) => {
    return NOTIFICATION_TYPES.find((t) => t.value === type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notification Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config?.isActive ? (
                <Bell className="h-6 w-6 text-green-600" />
              ) : (
                <BellOff className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-lg">Push Notification</CardTitle>
                <CardDescription>
                  Aktifkan atau nonaktifkan push notification untuk semua pengguna
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={config?.isActive ? "default" : "secondary"}>
                {config?.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
              <Switch
                checked={config?.isActive ?? false}
                onCheckedChange={togglePushNotification}
                disabled={saving}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Cara Kerja Push Notification:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    <strong>Pesanan Baru</strong> — Saat karyawan membuat pesanan, notifikasi dikirim ke semua driver yang status-nya <em>Tersedia</em>.
                  </li>
                  <li>
                    <strong>Pesanan Diterima</strong> — Saat driver menekan &quot;Terima&quot;, notifikasi dikirim ke karyawan yang memesan.
                  </li>
                  <li>
                    <strong>Perjalanan Selesai</strong> — Saat driver menyelesaikan perjalanan, notifikasi dikirim ke karyawan untuk memberi rating.
                  </li>
                </ol>
                <p className="mt-2 text-xs text-blue-600">
                  Pastikan FIREBASE_SERVICE_ACCOUNT_KEY dan NEXT_PUBLIC_FIREBASE_VAPID_KEY sudah diatur di environment variables.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Template Pesan Notifikasi</CardTitle>
              <CardDescription>
                Kelola template pesan push notification. Gunakan placeholder untuk mengisi data dinamis.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => openEditDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Placeholder Info */}
          <div className="mb-6 bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Placeholder yang tersedia:</p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map((p) => (
                <Badge key={p.key} variant="outline" className="text-xs font-mono">
                  {p.key} — {p.desc}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Template List */}
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Belum ada template. Klik &quot;Tambah Template&quot; untuk membuat template baru.
              </div>
            ) : (
              templates.map((template) => {
                const typeInfo = getTypeInfo(template.type);
                return (
                  <Card key={template.id} className={!template.isActive ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{typeInfo?.icon || "🔔"}</span>
                            <span className="font-semibold text-sm">{typeInfo?.label || template.type}</span>
                            <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                              {template.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {typeInfo?.description}
                          </p>
                          <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                            <p className="text-sm font-medium">{template.title}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {template.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              setDeletingId(template.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Tambah Template Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Perbarui template pesan notifikasi"
                : "Buat template pesan notifikasi baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Template</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. NEW_BOOKING"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipe Notifikasi</Label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Judul Notifikasi</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. 📋 Pesanan Baru!"
              />
            </div>

            <div className="space-y-2">
              <Label>Isi Pesan</Label>
              <Textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Gunakan placeholder seperti {employee_name}, {driver_name}, {pickup}, {destination}, {time}"
                rows={4}
              />
              <div className="flex flex-wrap gap-1">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                    onClick={() => setFormBody((prev) => prev + p.key)}
                  >
                    {p.key}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label>Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={saveTemplate} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Template</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus template ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={deleteTemplate} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
