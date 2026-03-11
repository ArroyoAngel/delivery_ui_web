'use client';

import { useState } from 'react';
import { Shield, Save } from 'lucide-react';
import { useUsers, useUpdateUserRoles } from '@/hooks/useUsers';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ROLE_LABELS, ROLE_COLORS, formatDate } from '@/lib/utils';
import type { User, UserRole } from '@/models';
import toast from 'react-hot-toast';

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: 'client', label: 'Cliente' },
  { value: 'restaurant_owner', label: 'Restaurante' },
  { value: 'rider', label: 'Repartidor' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const updateRoles = useUpdateUserRoles();

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);

  function startEdit(user: User) {
    setEditingUserId(user.id);
    setSelectedRoles(user.roles);
  }

  function toggleRole(role: UserRole) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function saveRoles(userId: string) {
    if (selectedRoles.length === 0) {
      toast.error('El usuario debe tener al menos un rol');
      return;
    }
    try {
      await updateRoles.mutateAsync({ id: userId, roles: selectedRoles });
      toast.success('Roles actualizados');
      setEditingUserId(null);
    } catch {
      toast.error('No se pudieron actualizar los roles');
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'user',
      label: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">
            {u.firstName?.[0] ?? '?'}{u.lastName?.[0] ?? ''}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-xs text-gray-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (u) => <span className="text-sm text-gray-600">{u.phone || '—'}</span>,
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (u) => (
        <div className="flex flex-wrap gap-1.5">
          {u.roles.map((r) => (
            <Badge key={r} label={ROLE_LABELS[r]} className={ROLE_COLORS[r]} />
          ))}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (u) => <span className="text-xs text-gray-400">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (u) => (
        <Button variant="ghost" size="sm" onClick={() => startEdit(u)}>
          <Shield size={14} />
          Editar roles
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Gestiona permisos y roles de administradores, repartidores y propietarios.
      </p>

      <DataTable
        columns={columns}
        data={users ?? []}
        keyField="id"
        loading={isLoading}
        emptyMessage="No hay usuarios disponibles"
      />

      {editingUserId && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Editar roles</h3>

            <div className="space-y-2 mb-5">
              {ALL_ROLES.map((role) => (
                <label
                  key={role.value}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditingUserId(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={updateRoles.isPending}
                onClick={() => saveRoles(editingUserId)}
              >
                <Save size={14} />
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
