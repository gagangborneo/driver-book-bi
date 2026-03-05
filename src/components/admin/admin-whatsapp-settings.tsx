'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Edit2, Check, X, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface WhatsAppConfig {
  id: string;
  deviceId: string;
  apiUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WhatsAppRoute {
  id: string;
  name: string;
  groupId: string;
  type: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminWhatsAppSettingsProps {
  token: string;
}

// Template type metadata with available placeholders and defaults
const TEMPLATE_TYPES = [
  {
    value: 'BOOKING',
    label: 'Pesanan Baru',
    sendMode: 'group' as const,
    sendModeLabel: '📢 Ke Grup Driver',
    description: 'Dikirim ke grup WhatsApp driver saat karyawan membuat pesanan baru',
    placeholders: [
      { key: '{pickupLocation}', desc: 'Lokasi jemput' },
      { key: '{destination}', desc: 'Tujuan' },
      { key: '{bookingTime}', desc: 'Waktu jemput' },
      { key: '{employeeName}', desc: 'Nama karyawan' },
      { key: '{employeePhone}', desc: 'No HP karyawan' },
      { key: '{waLink}', desc: 'Link wa.me/ karyawan' },
      { key: '{appUrl}', desc: 'URL aplikasi' },
    ],
    defaultContent: `🚗 Pesanan Driver Baru Masuk!

📍 Jemput: {pickupLocation}
📍 Tujuan: {destination}
⏰ Waktu: {bookingTime}
👤 Pemesan: {employeeName}
📞 HP: {employeePhone} ({waLink})

Segera cek aplikasi: {appUrl}`,
  },
  {
    value: 'ACCEPTED',
    label: 'Pesanan Diterima',
    sendMode: 'individual' as const,
    sendModeLabel: '📱 Ke Nomor Karyawan',
    description: 'Dikirim langsung ke nomor HP karyawan saat driver menerima pesanan',
    placeholders: [
      { key: '{driverName}', desc: 'Nama driver' },
      { key: '{appUrl}', desc: 'URL aplikasi' },
    ],
    defaultContent: `✅ Pesanan Diterima!

Driver: {driverName}

Periksa aplikasi untuk memantau perjalanan: {appUrl}`,
  },
  {
    value: 'COMPLETED',
    label: 'Perjalanan Selesai',
    sendMode: 'individual' as const,
    sendModeLabel: '📱 Ke Nomor Karyawan',
    description: 'Dikirim langsung ke nomor HP karyawan saat perjalanan selesai',
    placeholders: [
      { key: '{driverName}', desc: 'Nama driver' },
      { key: '{pickupLocation}', desc: 'Lokasi jemput' },
      { key: '{destination}', desc: 'Tujuan' },
      { key: '{appUrl}', desc: 'URL aplikasi' },
    ],
    defaultContent: `✅ Perjalanan Selesai!

Driver: {driverName}

📍 Dari: {pickupLocation}
📍 Ke: {destination}

Silakan berikan rating di aplikasi: {appUrl}`,
  },
  {
    value: 'CANCELLED',
    label: 'Pesanan Dibatalkan',
    sendMode: 'individual' as const,
    sendModeLabel: '📱 Ke Nomor Karyawan',
    description: 'Dikirim ke nomor HP karyawan saat pesanan dibatalkan',
    placeholders: [
      { key: '{cancellationReason}', desc: 'Alasan pembatalan' },
      { key: '{cancelledTime}', desc: 'Waktu pembatalan' },
    ],
    defaultContent: `❌ Pesanan Dibatalkan

Alasan: {cancellationReason}
Waktu: {cancelledTime}

Silakan hubungi admin jika ada pertanyaan.`,
  },
  {
    value: 'REMINDER',
    label: 'Pengingat',
    sendMode: 'individual' as const,
    sendModeLabel: '📱 Ke Nomor Karyawan',
    description: 'Pesan pengingat ke nomor HP karyawan',
    placeholders: [
      { key: '{pickupLocation}', desc: 'Lokasi jemput' },
      { key: '{destination}', desc: 'Tujuan' },
      { key: '{bookingTime}', desc: 'Waktu jemput' },
    ],
    defaultContent: `⏰ Pengingat Pesanan

Pesanan Anda dijadwalkan:
📍 Dari: {pickupLocation}
📍 Ke: {destination}
⏰ Waktu: {bookingTime}

Harap siap tepat waktu. Hubungi kami jika ada perubahan.`,
  },
  {
    value: 'OTHER',
    label: 'Lainnya',
    sendMode: 'individual' as const,
    sendModeLabel: '📱 Ke Nomor',
    description: 'Template kustom',
    placeholders: [],
    defaultContent: '',
  },
];

export function AdminWhatsAppSettings({ token }: AdminWhatsAppSettingsProps) {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [routes, setRoutes] = useState<WhatsAppRoute[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // Form states
  const [deviceId, setDeviceId] = useState('');
  const [apiUrl, setApiUrl] = useState('https://app.whacenter.com/api');
  const [configActive, setConfigActive] = useState(true);

  const [routeName, setRouteName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [routeType, setRouteType] = useState('BOOKING');
  const [routeDescription, setRouteDescription] = useState('');
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('BOOKING');
  const [templateContent, setTemplateContent] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [configData, routesData, templatesData] = await Promise.all([
        api('/whatsapp/config', {}, token),
        api('/whatsapp/routes', {}, token),
        api('/whatsapp/templates', {}, token),
      ]);

      setConfig(configData);
      if (configData) {
        setDeviceId(configData.deviceId);
        setApiUrl(configData.apiUrl);
        setConfigActive(configData.isActive);
      }

      setRoutes(routesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error);
      showMessage('Failed to load settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  // Config handlers
  const handleSaveConfig = async () => {
    try {
      if (!deviceId.trim()) {
        showMessage('Device ID is required', 'error');
        return;
      }

      const result = await api(
        '/whatsapp/config',
        {
          method: 'POST',
          body: JSON.stringify({
            deviceId,
            apiUrl,
            isActive: configActive,
          }),
        },
        token
      );

      setConfig(result);
      showMessage('Configuration saved successfully', 'success');
    } catch (error) {
      console.error('Error saving config:', error);
      showMessage('Failed to save configuration', 'error');
    }
  };

  // Route handlers
  const handleAddRoute = async () => {
    try {
      if (!routeName.trim() || !groupId.trim()) {
        showMessage('Name and Group ID are required', 'error');
        return;
      }

      const result = await api(
        '/whatsapp/routes',
        {
          method: 'POST',
          body: JSON.stringify({
            name: routeName,
            groupId,
            type: routeType,
            description: routeDescription,
          }),
        },
        token
      );

      setRoutes([result, ...routes]);
      setRouteName('');
      setGroupId('');
      setRouteType('BOOKING');
      setRouteDescription('');
      showMessage('Route added successfully', 'success');
    } catch (error) {
      console.error('Error adding route:', error);
      showMessage('Failed to add route', 'error');
    }
  };

  const handleUpdateRoute = async () => {
    if (!editingRouteId) return;

    try {
      const result = await api(
        `/whatsapp/routes/${editingRouteId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: routeName,
            groupId,
            type: routeType,
            description: routeDescription,
          }),
        },
        token
      );

      setRoutes(routes.map((r) => (r.id === editingRouteId ? result : r)));
      setRouteName('');
      setGroupId('');
      setRouteType('BOOKING');
      setRouteDescription('');
      setEditingRouteId(null);
      showMessage('Route updated successfully', 'success');
    } catch (error) {
      console.error('Error updating route:', error);
      showMessage('Failed to update route', 'error');
    }
  };

  const handleEditRoute = (route: WhatsAppRoute) => {
    setRouteName(route.name);
    setGroupId(route.groupId);
    setRouteType(route.type || 'BOOKING');
    setRouteDescription(route.description || '');
    setEditingRouteId(route.id);
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      await api(`/whatsapp/routes/${id}`, { method: 'DELETE' }, token);
      setRoutes(routes.filter((r) => r.id !== id));
      showMessage('Route deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting route:', error);
      showMessage('Failed to delete route', 'error');
    }
  };

  // Template handlers
  const handleAddTemplate = async () => {
    try {
      if (!templateName.trim() || !templateContent.trim()) {
        showMessage('Name and content are required', 'error');
        return;
      }

      const result = await api(
        '/whatsapp/templates',
        {
          method: 'POST',
          body: JSON.stringify({
            name: templateName,
            type: templateType,
            content: templateContent,
          }),
        },
        token
      );

      setTemplates([result, ...templates]);
      setTemplateName('');
      setTemplateType('BOOKING');
      setTemplateContent('');
      showMessage('Template added successfully', 'success');
    } catch (error) {
      console.error('Error adding template:', error);
      showMessage('Failed to add template', 'error');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplateId) return;

    try {
      const result = await api(
        `/whatsapp/templates/${editingTemplateId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: templateName,
            type: templateType,
            content: templateContent,
          }),
        },
        token
      );

      setTemplates(templates.map((t) => (t.id === editingTemplateId ? result : t)));
      setTemplateName('');
      setTemplateType('BOOKING');
      setTemplateContent('');
      setEditingTemplateId(null);
      showMessage('Template updated successfully', 'success');
    } catch (error) {
      console.error('Error updating template:', error);
      showMessage('Failed to update template', 'error');
    }
  };

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    setTemplateName(template.name);
    setTemplateType(template.type);
    setTemplateContent(template.content);
    setEditingTemplateId(template.id);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api(`/whatsapp/templates/${id}`, { method: 'DELETE' }, token);
      setTemplates(templates.filter((t) => t.id !== id));
      showMessage('Template deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting template:', error);
      showMessage('Failed to delete template', 'error');
    }
  };

  const handleCancelEdit = () => {
    setRouteName('');
    setGroupId('');
    setRouteType('BOOKING');
    setRouteDescription('');
    setEditingRouteId(null);
    setTemplateName('');
    setTemplateType('BOOKING');
    setTemplateContent('');
    setEditingTemplateId(null);
    setShowPreview(false);
  };

  // Insert placeholder at cursor position in textarea
  const insertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setTemplateContent((prev) => prev + placeholder);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = templateContent.substring(0, start) + placeholder + templateContent.substring(end);
    setTemplateContent(newContent);
    // Restore focus and move cursor after inserted placeholder
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
    }, 0);
  };

  // Load default template content for current type
  const loadDefaultTemplate = () => {
    const typeInfo = TEMPLATE_TYPES.find((t) => t.value === templateType);
    if (typeInfo?.defaultContent) {
      setTemplateContent(typeInfo.defaultContent);
      if (!templateName.trim()) {
        setTemplateName(typeInfo.label);
      }
    }
  };

  // Generate preview by replacing placeholders with example values
  const getPreviewContent = () => {
    const exampleValues: Record<string, string> = {
      '{pickupLocation}': 'Kantor BI Balikpapan',
      '{destination}': 'Bandara Sultan Aji Muhammad Sulaiman',
      '{bookingTime}': '08:30',
      '{employeeName}': 'Ahmad Fauzi',
      '{employeePhone}': '085175446620',
      '{waLink}': 'https://wa.me/6285175446620',
      '{appUrl}': 'https://lamin-bpp.web.id/',
      '{driverName}': 'Pak Budi',
      '{cancellationReason}': 'Perubahan jadwal',
      '{cancelledTime}': '07:15',
      '{vehiclePlateNo}': 'KT 1234 AB',
      '{status}': 'Disetujui',
      '{completedTime}': '10:45',
    };
    let preview = templateContent;
    Object.entries(exampleValues).forEach(([key, val]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), val);
    });
    return preview;
  };

  // Get current template type metadata
  const currentTypeInfo = TEMPLATE_TYPES.find((t) => t.value === templateType);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">Loading WhatsApp settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert className={messageType === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertDescription className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="routes">Routes/Groups</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Device ID</label>
                <Input
                  type="text"
                  placeholder="e.g., e6683d05a9bfa0f2ca6087857cff17ed"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Unique device identifier for WACenter API</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">API URL</label>
                <Input
                  type="text"
                  placeholder="https://app.whacenter.com/api"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">WhatsApp API endpoint URL</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="configActive"
                  checked={configActive}
                  onChange={(e) => setConfigActive(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="configActive" className="text-sm font-medium">
                  Active
                </label>
              </div>

              <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                <p className="font-semibold mb-2">ℹ️ Environment Variable</p>
                <p>You can also set:</p>
                <code className="block bg-gray-200 p-2 rounded mt-1">
                  WHATSAPP_DEVICE_ID=&quot;{deviceId||'your-device-id'}&quot;
                </code>
              </div>

              <Button onClick={handleSaveConfig} className="w-full bg-blue-600 hover:bg-blue-700">
                Save Configuration
              </Button>

              {config && (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                  ✓ Configuration last updated: {new Date(config.updatedAt).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle>Tujuan Grup WhatsApp</CardTitle>
              <p className="text-sm text-muted-foreground">
                Atur grup WhatsApp tujuan untuk notifikasi bertipe <strong>grup</strong>. Saat ini hanya tipe &quot;Pesanan Baru&quot; yang dikirim ke grup. Notifikasi lainnya (Diterima, Selesai, dll) dikirim langsung ke nomor HP karyawan.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-2">
                <p className="font-semibold text-blue-800">📋 Tipe Pengiriman Notifikasi</p>
                <div className="grid grid-cols-1 gap-1 text-blue-700">
                  {TEMPLATE_TYPES.filter((t) => t.value !== 'OTHER').map((t) => (
                    <div key={t.value} className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.sendMode === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {t.sendModeLabel}
                      </span>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-b pb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {editingRouteId ? 'Edit Route Grup' : 'Tambah Route Grup'}
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-1">Nama Route</label>
                  <Input
                    placeholder="contoh: Grup Driver Balikpapan"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Group ID</label>
                  <Input
                    placeholder="contoh: WAGDriver"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Nama grup WhatsApp yang terdaftar di WACenter</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipe Notifikasi</label>
                  <select
                    value={routeType}
                    onChange={(e) => setRouteType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {TEMPLATE_TYPES.filter((t) => t.sendMode === 'group').map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">ℹ️ Hanya tipe notifikasi yang dikirim ke grup yang bisa dikonfigurasi di sini</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
                  <Input
                    placeholder="contoh: Grup untuk notifikasi driver"
                    value={routeDescription}
                    onChange={(e) => setRouteDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={editingRouteId ? handleUpdateRoute : handleAddRoute}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {editingRouteId ? 'Simpan Perubahan' : 'Tambah Route'}
                  </Button>
                  {editingRouteId && (
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Daftar Route Grup</h3>
                {routes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm mb-2">Belum ada route yang dikonfigurasi.</p>
                    <p className="text-xs">Notifikasi pesanan baru akan dikirim ke grup default &quot;WAGDriver&quot;.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {routes.map((route) => {
                      const typeInfo = TEMPLATE_TYPES.find((t) => t.value === route.type);
                      return (
                        <div key={route.id} className="border rounded p-3 flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{route.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${route.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {route.isActive ? '✓ Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">Group ID: <span className="font-mono">{route.groupId}</span></p>
                            <p className="text-xs text-purple-600">📢 {typeInfo?.label || route.type} — ke grup</p>
                            {route.description && (
                              <p className="text-sm text-gray-500 mt-1">{route.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRoute(route)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRoute(route.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Template Pesan WhatsApp</CardTitle>
              <p className="text-sm text-muted-foreground">
                Template yang aktif akan digunakan saat mengirim notifikasi WhatsApp. Jika tidak ada template aktif untuk suatu tipe, sistem akan menggunakan template bawaan.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 border-b pb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {editingTemplateId ? 'Edit Template' : 'Tambah Template Baru'}
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-1">Nama Template</label>
                  <Input
                    placeholder="contoh: Notifikasi Pesanan Baru"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipe Template</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {TEMPLATE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {currentTypeInfo?.description && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${currentTypeInfo.sendMode === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {currentTypeInfo.sendModeLabel}
                      </span>
                      <p className="text-xs text-gray-500">{currentTypeInfo.description}</p>
                    </div>
                  )}
                </div>

                {/* Available placeholders */}
                {currentTypeInfo && currentTypeInfo.placeholders.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Variabel yang Tersedia</label>
                    <p className="text-xs text-gray-500 mb-2">Klik untuk menyisipkan ke pesan:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentTypeInfo.placeholders.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => insertPlaceholder(p.key)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                          title={p.desc}
                        >
                          <span className="font-mono">{p.key}</span>
                          <span className="text-blue-400">— {p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">Isi Pesan</label>
                    <div className="flex gap-2">
                      {currentTypeInfo?.defaultContent && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={loadDefaultTemplate}
                          className="text-xs h-7"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Isi Default
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs h-7"
                      >
                        {showPreview ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                        {showPreview ? 'Tutup Preview' : 'Preview'}
                      </Button>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    placeholder="Tulis pesan template di sini... Gunakan variabel seperti {pickupLocation} yang akan diganti otomatis."
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md min-h-40 font-mono text-sm"
                  />
                </div>

                {/* Live Preview */}
                {showPreview && templateContent && (
                  <div>
                    <label className="block text-sm font-medium mb-1">📱 Preview Pesan (dengan data contoh)</label>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 whitespace-pre-wrap text-sm font-sans">
                      {getPreviewContent()}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={editingTemplateId ? handleUpdateTemplate : handleAddTemplate}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {editingTemplateId ? 'Simpan Perubahan' : 'Tambah Template'}
                  </Button>
                  {editingTemplateId && (
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Daftar Template</h3>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm mb-2">Belum ada template yang dibuat.</p>
                    <p className="text-xs">Sistem akan menggunakan template bawaan. Tambahkan template untuk mengkustomisasi pesan.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => {
                      const typeInfo = TEMPLATE_TYPES.find((t) => t.value === template.type);
                      return (
                        <div key={template.id} className="border rounded p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{template.name}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {template.isActive ? '✓ Aktif' : 'Nonaktif'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <span className={`px-1.5 py-0.5 rounded-full font-medium ${typeInfo?.sendMode === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {typeInfo?.sendModeLabel || template.type}
                                </span>
                                {typeInfo?.label || template.type}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTemplate(template)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap break-words font-mono">
                            {template.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
