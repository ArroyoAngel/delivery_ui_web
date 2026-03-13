'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Save, RotateCcw } from 'lucide-react';
import { useRolePermissions, useUpdateRolePermissions } from '@/hooks/useRoles';
import type { RolePermissions } from '@/hooks/useRoles';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const AVAILABLE_ROUTES: { path: string; label: string }[] = [
  { path: '/dashboard',              label: 'Dashboard'        },
  { path: '/dashboard/orders',       label: 'Pedidos'          },
  { path: '/dashboard/my-restaurant',label: 'Mi Restaurante'   },
  { path: '/dashboard/staff',        label: 'Mi Personal'      },
  { path: '/dashboard/restaurants',  label: 'Restaurantes'     },
  { path: '/dashboard/users',        label: 'Usuarios'         },
  { path: '/dashboard/riders',       label: 'Repartidores'     },
  { path: '/dashboard/config',       label: 'Configuración'    },
  { path: '/dashboard/roles',        label: 'Roles'            },
];

const ROLE_META: { role: string; label: string; color: string }[] = [
  { role: 'superadmin', label: 'Super Admin', color: 'bg-red-100 text-red-700'    },
  { role: 'admin',      label: 'Admin',       color: 'bg-orange-100 text-orange-700' },
  { role: 'rider',      label: 'Repartidor',  color: 'bg-blue-100 text-blue-700'  },
  { role: 'client',     label: 'Cliente',     color: 'bg-gray-100 text-gray-600'  },
];

export default function RolesPage() {
  const { data: serverData, isLoading } = useRolePermissions();
  const updateRole = useUpdateRolePermissions();

  // Local editable state: map role → Set<route>
  const [draft, setDraft] = useState<Record<string, Set<string>>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!serverData) return;
    const initial: Record<string, Set<string>> = {};
    for (const rp of serverData) {
      initial[rp.role] = new Set(rp.routes);
    }
    setDraft(initial);
    setDirty(false);
  }, [serverData]);

  function toggle(role: string, path: string) {
    setDraft((prev) => {
      const set = new Set(prev[role] ?? []);
      if (set.has(path)) set.delete(path);
      else set.add(path);
      return { ...prev, [role]: set };
    });
    setDirty(true);
  }

  function reset() {
    if (!serverData) return;
    const initial: Record<string, Set<string>> = {};
    for (const rp of serverData) {
      initial[rp.role] = new Set(rp.routes);
    }
    setDraft(initial);
    setDirty(false);
  }

  async function save() {
    setSaving(true);
    try {
      const roles = Object.keys(draft);
      await Promise.all(
        roles.map((role) =>
          updateRole.mutateAsync({ role, routes: [...draft[role]] }),
        ),
      );
      toast.success('Permisos actualizados');
      setDirty(false);
    } catch {
      toast.error('Error al guardar los permisos');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-gray-500">
            Controlá qué secciones del panel puede ver cada rol del sistema.
          </p>
        </div>
        {dirty && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={reset} disabled={saving}>
              <RotateCcw size={14} />
              Descartar
            </Button>
            <Button variant="primary" size="sm" onClick={save} disabled={saving} loading={saving}>
              <Save size={14} />
              Guardar cambios
            </Button>
          </div>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">
                  Sección
                </th>
                {ROLE_META.map((rm) => (
                  <th key={rm.role} className="text-center py-3 px-4 min-w-[110px]">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${rm.color}`}>
                      <ShieldCheck size={11} />
                      {rm.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AVAILABLE_ROUTES.map((route, idx) => (
                <tr
                  key={route.path}
                  className={`border-b border-gray-50 transition-colors hover:bg-gray-50/60 ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                >
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-medium text-gray-800">{route.label}</p>
                      <p className="text-xs text-gray-400">{route.path}</p>
                    </div>
                  </td>
                  {ROLE_META.map((rm) => {
                    const checked = draft[rm.role]?.has(route.path) ?? false;
                    return (
                      <td key={rm.role} className="text-center py-3 px-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(rm.role, route.path)}
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {dirty && (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={reset} disabled={saving}>
            <RotateCcw size={14} />
            Descartar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving} loading={saving}>
            <Save size={14} />
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  );
}
