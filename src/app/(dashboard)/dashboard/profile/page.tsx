'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Phone, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, token, setAuth } = useAuthStore();

  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await api.patch('/api/users/profile', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });
      // Update auth store so sidebar initials update immediately
      if (user && token) {
        setAuth(token, { ...user, firstName: data.firstName, lastName: data.lastName, phone: data.phone });
      }
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Mi Perfil</h1>

      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {`${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`.toUpperCase() || <User size={20} />}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.roles?.join(', ')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Apellido"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1.5"><Phone size={13} /> Teléfono de contacto</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="+591 7XXXXXXX"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si eres superadmin, este número se comparte con clientes que soliciten soporte humano.
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2"
        >
          <Save size={15} />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Card>
    </div>
  );
}
