'use client';

import { useState } from 'react';
import {
  UserPlus,
  Trash2,
  ShieldCheck,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Users,
} from 'lucide-react';
import {
  useMyRestaurant,
  useRestaurantStaff,
  useCreateStaff,
  useUpdateStaffPermissions,
  useRemoveStaff,
} from '@/hooks/useRestaurants';
import {
  STAFF_PERMISSIONS,
  STAFF_PERMISSION_LABELS,
  RESERVED_ROLE_NAMES,
  type StaffPermission,
  type RestaurantStaff,
} from '@/models';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

// ── Formulario de nuevo staff ─────────────────────────────────────────────────

const EMPTY_FORM = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  roleName: '',
  permissions: [] as StaffPermission[],
};

function CreateStaffModal({
  restaurantId,
  onClose,
}: {
  restaurantId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const createStaff = useCreateStaff();

  function togglePermission(p: StaffPermission) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter((x) => x !== p)
        : [...f.permissions, p],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password || !form.firstName || !form.lastName || !form.roleName) {
      toast.error('Completá todos los campos obligatorios');
      return;
    }
    if (RESERVED_ROLE_NAMES.includes(form.roleName.toLowerCase().trim() as never)) {
      toast.error(`"${form.roleName}" está reservado. Usá un nombre como "Cajero" o "Cocina".`);
      return;
    }
    setSaving(true);
    try {
      await createStaff.mutateAsync({ restaurantId, ...form });
      toast.success('Personal registrado exitosamente');
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al registrar personal';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Registrar personal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                className={inputCls}
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Apellido <span className="text-red-400">*</span>
              </label>
              <input
                className={inputCls}
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Cargo <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              value={form.roleName}
              onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))}
              placeholder="Cajero, Cocina, Supervisor…"
            />
            <p className="text-xs text-gray-400 mt-1">
              No se permiten cargos reservados como "Administrador" o "Superadmin".
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="staff@restaurante.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Contraseña temporal <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+591 7xxxxxxx"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Permisos</label>
            <p className="text-xs text-gray-400 mb-2">
              Solo podés otorgar permisos que vos mismo tenés.
            </p>
            <div className="space-y-2">
              {STAFF_PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => togglePermission(p)}
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                      form.permissions.includes(p)
                        ? 'bg-orange-500 border-orange-500'
                        : 'border-gray-300 group-hover:border-orange-400'
                    }`}
                  >
                    {form.permissions.includes(p) && <Check size={11} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">{STAFF_PERMISSION_LABELS[p]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Registrando…' : 'Registrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Fila de staff expandible ──────────────────────────────────────────────────

function StaffRow({
  member,
  restaurantId,
}: {
  member: RestaurantStaff;
  restaurantId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingPerms, setEditingPerms] = useState<StaffPermission[]>(member.permissions);
  const [saving, setSaving] = useState(false);
  const updatePerms = useUpdateStaffPermissions();
  const removeStaff = useRemoveStaff();

  async function handleSavePermissions() {
    setSaving(true);
    try {
      await updatePerms.mutateAsync({ restaurantId, staffId: member.id, permissions: editingPerms });
      toast.success('Permisos actualizados');
      setExpanded(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al actualizar permisos';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`¿Remover a ${member.firstName} ${member.lastName} del personal?`)) return;
    try {
      await removeStaff.mutateAsync({ restaurantId, staffId: member.id });
      toast.success('Personal removido');
    } catch {
      toast.error('Error al remover personal');
    }
  }

  function togglePerm(p: StaffPermission) {
    setEditingPerms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 bg-white">
        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-orange-600">
            {member.firstName[0]}{member.lastName[0]}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">
              {member.firstName} {member.lastName}
            </p>
            {member.roleName && (
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                member.isOwner
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {member.roleName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Mail size={10} /> {member.email}
            </span>
            {member.phone && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Phone size={10} /> {member.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {member.isOwner && (
            <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium hidden sm:block">
              Propietario
            </span>
          )}
          <span className="text-xs text-gray-400 hidden sm:block">
            {member.permissions.length} permiso{member.permissions.length !== 1 ? 's' : ''}
          </span>
          {!member.isOwner && (
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
              title="Remover personal"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={() => {
              setEditingPerms(member.permissions);
              setExpanded((v) => !v);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
            title="Editar permisos"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Permissions panel */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <ShieldCheck size={13} />
            Permisos asignados
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STAFF_PERMISSIONS.map((p) => (
              <label key={p} className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => togglePerm(p)}
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                    editingPerms.includes(p)
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300 group-hover:border-orange-400'
                  }`}
                >
                  {editingPerms.includes(p) && <Check size={11} className="text-white" />}
                </div>
                <span className="text-xs text-gray-700">{STAFF_PERMISSION_LABELS[p]}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExpanded(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSavePermissions} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar permisos'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Contenido de la página ────────────────────────────────────────────────────

function StaffContent({ restaurantId }: { restaurantId: string }) {
  const { data: staff, isLoading } = useRestaurantStaff(restaurantId);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">Personal del restaurante</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Creá cuentas para tu equipo y asignales permisos específicos.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <UserPlus size={14} />
          Agregar personal
        </Button>
      </div>

      {/* Info callout */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <p className="text-xs text-orange-700 leading-relaxed">
          <strong>Jerarquía de permisos:</strong> Solo podés otorgar a tu personal los permisos
          que vos mismo tenés. Si tu cuenta pierde el rol de administrador, los accesos de todo el
          personal derivado se revocan automáticamente.
        </p>
      </div>

      {/* Staff list */}
      {isLoading ? (
        <PageLoader />
      ) : !staff || staff.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Sin personal registrado</p>
            <p className="text-xs mt-1">
              Agregá miembros de tu equipo para que puedan gestionar el restaurante.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-5"
              onClick={() => setShowCreate(true)}
            >
              <UserPlus size={14} />
              Agregar primer miembro
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <StaffRow key={member.id} member={member} restaurantId={restaurantId} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateStaffModal restaurantId={restaurantId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function StaffPage() {
  const { data: restaurant, isLoading, isError } = useMyRestaurant();

  if (isLoading) return <PageLoader />;

  if (isError || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Users size={40} className="mb-4 opacity-30" />
        <p className="text-sm">No tenés un restaurante asignado.</p>
        <p className="text-xs mt-1">Contactá a un administrador.</p>
      </div>
    );
  }

  return <StaffContent restaurantId={restaurant.id} />;
}
