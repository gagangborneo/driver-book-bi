'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';

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
  const [routeDescription, setRouteDescription] = useState('');
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('BOOKING');
  const [templateContent, setTemplateContent] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

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
            description: routeDescription,
          }),
        },
        token
      );

      setRoutes([result, ...routes]);
      setRouteName('');
      setGroupId('');
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
            description: routeDescription,
          }),
        },
        token
      );

      setRoutes(routes.map((r) => (r.id === editingRouteId ? result : r)));
      setRouteName('');
      setGroupId('');
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
    setRouteDescription('');
    setEditingRouteId(null);
    setTemplateName('');
    setTemplateType('BOOKING');
    setTemplateContent('');
    setEditingTemplateId(null);
  };

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
              <CardTitle>WhatsApp Routes/Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 border-b pb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {editingRouteId ? 'Edit Route' : 'Add New Route'}
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-1">Route Name</label>
                  <Input
                    placeholder="e.g., Driver Group, Employee Group"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Group ID</label>
                  <Input
                    placeholder="e.g., WAGDriver"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">WhatsApp group identifier</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <Input
                    placeholder="e.g., Group for driver notifications"
                    value={routeDescription}
                    onChange={(e) => setRouteDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={editingRouteId ? handleUpdateRoute : handleAddRoute}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {editingRouteId ? 'Update Route' : 'Add Route'}
                  </Button>
                  {editingRouteId && (
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Routes List</h3>
                {routes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No routes configured yet.</p>
                ) : (
                  <div className="space-y-2">
                    {routes.map((route) => (
                      <div key={route.id} className="border rounded p-3 flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{route.name}</p>
                          <p className="text-sm text-gray-600">Group ID: {route.groupId}</p>
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
                    ))}
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
              <CardTitle>Message Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 border-b pb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {editingTemplateId ? 'Edit Template' : 'Add New Template'}
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-1">Template Name</label>
                  <Input
                    placeholder="e.g., New Booking Notification"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Template Type</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="BOOKING">Booking New</option>
                    <option value="ACCEPTED">Booking Accepted</option>
                    <option value="COMPLETED">Booking Completed</option>
                    <option value="CANCELLED">Booking Cancelled</option>
                    <option value="REMINDER">Reminder</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message Content</label>
                  <textarea
                    placeholder="e.g., 🚗 Pesanan Driver Baru Masuk!&#10;&#10;📍 Jemput: {pickupLocation}&#10;📍 Tujuan: {destination}&#10;⏰ Waktu: {bookingTime}&#10;&#10;Segera cek aplikasi: {appUrl}"
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md min-h-32 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use placeholders like {'{pickupLocation}'}, {'{destination}'}, {'{bookingTime}'}, {'{appUrl}'}, {'{driverName}'},
                    etc.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={editingTemplateId ? handleUpdateTemplate : handleAddTemplate}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {editingTemplateId ? 'Update Template' : 'Add Template'}
                  </Button>
                  {editingTemplateId && (
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Templates List</h3>
                {templates.length === 0 ? (
                  <p className="text-gray-500 text-sm">No templates configured yet.</p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div key={template.id} className="border rounded p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-gray-500">Type: {template.type}</p>
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
                        <p className="text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap break-words">
                          {template.content}
                        </p>
                      </div>
                    ))}
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
