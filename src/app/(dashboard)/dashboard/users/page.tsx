'use client';

import { useRef, useState } from 'react';
import { Shield, Save, X, ChevronRight, Upload, ImageIcon, User as UserIcon } from 'lucide-react';
import { useUsers, useUpdateUserRoles, useUpdateRiderInfo, useUpdateAdminInfo, useUploadRiderImage, useUpdateUserProfile } from '@/hooks/useUsers';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ROLE_LABELS, ROLE_COLORS, formatDate } from '@/lib/utils';
import type { User, UserRole, VehicleType } from '@/models';
import toast from 'react-hot-toast';

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: 'client',     label: 'Cliente'     },
  { value: 'admin',      label: 'Admin'       },
  { value: 'rider',      label: 'Repartidor'  },
  { value: 'superadmin', label: 'Super Admin' },
];

type ModalStep = 'roles' | 'rider-info' | 'admin-info';

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const updateRoles = useUpdateUserRoles();
  const updateRiderInfo = useUpdateRiderInfo();
  const updateAdminInfo = useUpdateAdminInfo();
  const uploadRiderImage = useUploadRiderImage();
  const updateProfile = useUpdateUserProfile();

  // Profile edit state
  const [editingProfileUser, setEditingProfileUser] = useState<User | null>(null);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [step, setStep] = useState<ModalStep>('roles');

  // Rider info form state
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [licenseFrontUrl, setLicenseFrontUrl] = useState('');
  const [licenseBackUrl, setLicenseBackUrl] = useState('');
  const [plate, setPlate] = useState('');
  const [policyUrl, setPolicyUrl] = useState('');
  const [vin, setVin] = useState('');
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Admin info form state
  const [startedAt, setStartedAt] = useState('');

  function prefillUser(user: User) {
    setEditingUser(user);
    setSelectedRoles(user.roles);
    setVehicleType((user.riderInfo?.vehicleType as VehicleType) ?? '');
    setLicenseFrontUrl(user.riderInfo?.licenseFrontUrl ?? '');
    setLicenseBackUrl(user.riderInfo?.licenseBackUrl ?? '');
    setPlate(user.riderInfo?.plate ?? '');
    setPolicyUrl(user.riderInfo?.policyUrl ?? '');
    setVin(user.riderInfo?.vin ?? '');
    setStartedAt(user.adminInfo?.startedAt ?? '');
  }

  function startEdit(user: User) {
    prefillUser(user);
    setStep('roles');
  }

  function startEditProfile(user: User) {
    setEditingProfileUser(user);
    setProfileFirstName(user.firstName ?? '');
    setProfileLastName(user.lastName ?? '');
    setProfilePhone(user.phone ?? '');
  }

  async function saveProfile() {
    if (!editingProfileUser) return;
    try {
      await updateProfile.mutateAsync({
        id: editingProfileUser.id,
        firstName: profileFirstName,
        lastName: profileLastName,
        phone: profilePhone,
      });
      toast.success('Perfil actualizado');
      setEditingProfileUser(null);
    } catch {
      toast.error('No se pudo actualizar el perfil');
    }
  }

  function closeModal() {
    setEditingUser(null);
    setStep('roles');
  }

  function toggleRole(role: UserRole) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function saveRoles() {
    if (!editingUser) return;
    if (selectedRoles.length === 0) {
      toast.error('El usuario debe tener al menos un rol');
      return;
    }
    try {
      await updateRoles.mutateAsync({ id: editingUser.id, roles: selectedRoles });
      toast.success('Roles actualizados');

      // Move to extra info step if applicable
      const hasRider = selectedRoles.includes('rider');
      const hasAdmin = selectedRoles.includes('admin');
      if (hasRider) {
        setStep('rider-info');
      } else if (hasAdmin) {
        setStep('admin-info');
      } else {
        closeModal();
      }
    } catch {
      toast.error('No se pudieron actualizar los roles');
    }
  }

  async function handleImageUpload(type: 'front' | 'back', file: File) {
    if (!editingUser) return;
    try {
      const url = await uploadRiderImage.mutateAsync({ id: editingUser.id, type, file });
      if (type === 'front') setLicenseFrontUrl(url);
      else setLicenseBackUrl(url);
    } catch {
      toast.error('No se pudo subir la imagen');
    }
  }

  async function saveRiderInfo(skipToAdmin = false) {
    if (!editingUser) return;
    try {
      await updateRiderInfo.mutateAsync({
        id: editingUser.id,
        info: {
          vehicleType: vehicleType || null,
          licenseFrontUrl: licenseFrontUrl || null,
          licenseBackUrl: licenseBackUrl || null,
          plate: plate || null,
          policyUrl: policyUrl || null,
          vin: vin || null,
        },
      });
      toast.success('Info del repartidor guardada');
      if (skipToAdmin || !selectedRoles.includes('admin')) {
        closeModal();
      } else {
        setStep('admin-info');
      }
    } catch {
      toast.error('No se pudo guardar la info del repartidor');
    }
  }

  async function saveAdminInfo() {
    if (!editingUser) return;
    try {
      await updateAdminInfo.mutateAsync({
        id: editingUser.id,
        info: { startedAt: startedAt || null },
      });
      toast.success('Info del administrador guardada');
      closeModal();
    } catch {
      toast.error('No se pudo guardar la info del administrador');
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
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => startEdit(u)}>
            <Shield size={14} />
            Roles
          </Button>
          <Button variant="ghost" size="sm" onClick={() => startEditProfile(u)}>
            <UserIcon size={14} />
            Perfil
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Gestiona permisos y roles de administradores, repartidores y clientes.
      </p>

      <DataTable
        columns={columns}
        data={users ?? []}
        keyField="id"
        loading={isLoading}
        emptyMessage="No hay usuarios disponibles"
      />

      {editingUser && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

            {/* ── Step 1: Roles ── */}
            {step === 'roles' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Editar roles</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

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
                  <Button variant="secondary" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    loading={updateRoles.isPending}
                    onClick={saveRoles}
                  >
                    {selectedRoles.includes('rider') || selectedRoles.includes('admin') ? (
                      <>Siguiente <ChevronRight size={14} /></>
                    ) : (
                      <><Save size={14} /> Guardar</>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* ── Step 2a: Rider info ── */}
            {step === 'rider-info' && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-semibold text-gray-900">Datos del repartidor</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-4">Todos los campos son opcionales.</p>

                <div className="space-y-3 mb-5">
                  {/* License photos */}
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: 'Licencia anverso', type: 'front' as const, url: licenseFrontUrl, ref: frontInputRef },
                      { label: 'Licencia reverso', type: 'back' as const, url: licenseBackUrl, ref: backInputRef },
                    ] as const).map(({ label, type, url, ref }) => (
                      <div key={type}>
                        <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
                        <input
                          ref={ref}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(type, f);
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => ref.current?.click()}
                          disabled={uploadRiderImage.isPending}
                          className="w-full h-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-1 overflow-hidden relative"
                        >
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt={label} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <ImageIcon size={22} className="text-gray-300" />
                              <span className="text-xs text-gray-400">Subir foto</span>
                            </>
                          )}
                          {uploadRiderImage.isPending && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <Upload size={16} className="text-orange-500 animate-bounce" />
                            </div>
                          )}
                        </button>
                        {url && (
                          <button
                            type="button"
                            onClick={() => type === 'front' ? setLicenseFrontUrl('') : setLicenseBackUrl('')}
                            className="text-xs text-red-400 hover:text-red-600 mt-1"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Vehículo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vehículo</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                    >
                      <option value="">Sin especificar</option>
                      <option value="moto">Moto</option>
                      <option value="auto">Auto</option>
                      <option value="bici">Bicicleta</option>
                    </select>
                  </div>

                  {/* Text fields */}
                  {[
                    { label: 'Placa', value: plate, set: setPlate },
                    { label: 'Póliza — URL o referencia', value: policyUrl, set: setPolicyUrl },
                    { label: 'VIN / Chasis', value: vin, set: setVin },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                        placeholder="Opcional"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between gap-2">
                  <Button variant="secondary" onClick={() => closeModal()}>
                    Omitir
                  </Button>
                  <div className="flex gap-2">
                    {selectedRoles.includes('admin') && (
                      <Button
                        variant="secondary"
                        loading={updateRiderInfo.isPending}
                        onClick={() => saveRiderInfo(false)}
                      >
                        Guardar y continuar <ChevronRight size={14} />
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      loading={updateRiderInfo.isPending}
                      onClick={() => saveRiderInfo(!selectedRoles.includes('admin'))}
                    >
                      <Save size={14} />
                      {selectedRoles.includes('admin') ? 'Solo guardar' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2b: Admin info ── */}
            {step === 'admin-info' && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-semibold text-gray-900">Datos del administrador</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-4">Todos los campos son opcionales.</p>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Antigüedad — Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={startedAt}
                    onChange={(e) => setStartedAt(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                  />
                </div>

                <div className="flex justify-between gap-2">
                  <Button variant="secondary" onClick={closeModal}>
                    Omitir
                  </Button>
                  <Button
                    variant="primary"
                    loading={updateAdminInfo.isPending}
                    onClick={saveAdminInfo}
                  >
                    <Save size={14} />
                    Guardar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Edit profile modal ── */}
      {editingProfileUser && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Editar perfil</h3>
              <button onClick={() => setEditingProfileUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { label: 'Nombre', value: profileFirstName, set: setProfileFirstName },
                { label: 'Apellido', value: profileLastName, set: setProfileLastName },
                { label: 'Teléfono', value: profilePhone, set: setProfilePhone },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditingProfileUser(null)}>
                Cancelar
              </Button>
              <Button variant="primary" loading={updateProfile.isPending} onClick={saveProfile}>
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
