'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UserPlus, Users, Upload, X } from 'lucide-react';
import { useCreateShop, useBusinessTypes, useShopCategories, useAssignShopCategories, useUploadShopImage } from '@/hooks/useShops';
import { type ShopCategory } from '@/models';
import { useAdminUsers, useCreateAdminUser } from '@/hooks/useUsers';
import Button from '@/components/ui/Button';
import SelectableChip from '@/components/ui/SelectableChip';
import ShopLocationPicker from '@/components/ui/ShopLocationPicker';
import toast from 'react-hot-toast';


type OwnerMode = 'existing' | 'new';

const INPUT_CLS =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400';

export default function NewShopPage() {
  const router = useRouter();
  const createShop = useCreateShop();
  const createAdminUser = useCreateAdminUser();
  const assignCategories = useAssignShopCategories();
  const uploadImage = useUploadShopImage();
  const { data: adminUsers = [] } = useAdminUsers();
  const { data: businessTypes = [] } = useBusinessTypes();
  const { data: allCategories = [] } = useShopCategories();
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Shop fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [deliveryTimeMin, setDeliveryTimeMin] = useState('30');
  const [minimumOrder, setMinimumOrder] = useState('0');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // GPS
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Owner
  const [ownerMode, setOwnerMode] = useState<OwnerMode>('existing');
  const [ownerAccountId, setOwnerAccountId] = useState('');

  // New owner fields
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStartedAt, setNewStartedAt] = useState('');

  // Only admins who don't own a shop yet
  const availableAdmins = adminUsers.filter((u) => !u.shopId);
  const hasAvailableAdmins = availableAdmins.length > 0;
  const effectiveMode: OwnerMode = hasAvailableAdmins ? ownerMode : 'new';

  // Filtrar categorías por tipo de negocio
  const availableCategories = useMemo(
    () => allCategories.filter((cat: ShopCategory) => cat.id === businessType),
    [allCategories, businessType],
  );

  // Limpiar categorías seleccionadas cuando cambia el tipo de negocio
  const handleBusinessTypeChange = (value: string) => {
    setBusinessType(value);
    setSelectedCategoryIds([]);
  };

  const isSubmitting = createShop.isPending || createAdminUser.isPending || assignCategories.isPending;

  function handleMapChange(newLat: number | null, newLng: number | null) {
    setLat(newLat);
    setLng(newLng);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview sin subir al servidor hasta que exista la tienda
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error('Nombre y dirección son obligatorios');
      return;
    }

    if (lat === null || lng === null) {
      toast.error('La ubicación en el mapa es obligatoria');
      return;
    }

    if (effectiveMode === 'existing' && !ownerAccountId) {
      toast.error('Debes seleccionar un propietario');
      return;
    }

    let resolvedOwnerId = ownerAccountId || undefined;

    if (effectiveMode === 'new') {
      if (!newEmail.trim() || !newPassword.trim() || !newFirstName.trim() || !newLastName.trim()) {
        toast.error('Email, contraseña, nombre y apellido del propietario son obligatorios');
        return;
      }
      try {
        const newUser = await createAdminUser.mutateAsync({
          email: newEmail.trim(),
          password: newPassword,
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          phone: newPhone.trim() || undefined,
          startedAt: newStartedAt || undefined,
        });
        resolvedOwnerId = newUser.id;
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e?.response?.data?.message ?? 'No se pudo crear el propietario');
        return;
      }
    }

    try {
      const shop = await createShop.mutateAsync({
        name: name.trim(),
        address: address.trim(),
        description: description.trim() || undefined,
        businessType,
        ownerAccountId: resolvedOwnerId,
        deliveryTimeMin: Number(deliveryTimeMin) || 30,
        minimumOrder: Number(minimumOrder) || 0,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
      });

      // Subir imagen si hay seleccionada
      if (imageUrl && imageInputRef.current?.files?.[0]) {
        try {
          await uploadImage.mutateAsync({
            shopId: shop.id,
            file: imageInputRef.current.files[0],
          });
        } catch {
          toast.error('Negocio creado pero no se pudo subir la imagen');
        }
      }

      // Asignar categorías si hay seleccionadas
      if (selectedCategoryIds.length > 0) {
        try {
          await assignCategories.mutateAsync({
            shopId: shop.id,
            categoryIds: selectedCategoryIds,
          });
        } catch {
          toast.error('Negocio creado pero no se pudieron asignar las categorías');
        }
      }

      toast.success('Negocio creado correctamente');
      router.push(`/dashboard/shops/${shop.id}`);
    } catch {
      toast.error('No se pudo crear el negocio');
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Nuevo negocio</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        {/* Imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del negocio</label>
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(null);
                    if (imageInputRef.current) imageInputRef.current.value = '';
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                <Upload size={24} />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadImage.isPending}
                className="hidden"
                id="image-input"
              />
              <label
                htmlFor="image-input"
                className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer hover:bg-orange-600 transition-colors"
              >
                {uploadImage.isPending ? 'Subiendo...' : 'Seleccionar imagen'}
              </label>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, máx 5MB</p>
            </div>
          </div>
        </div>

        {/* Tipo de negocio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de negocio</label>
          <select value={businessType} onChange={(e) => handleBusinessTypeChange(e.target.value)} className={INPUT_CLS}>
            {businessTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Categorías */}
        {availableCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Categorías</label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat: ShopCategory) => (
                <SelectableChip
                  key={cat.id}
                  id={cat.id}
                  label={cat.name}
                  icon={cat.icon}
                  selected={selectedCategoryIds.includes(cat.id)}
                  onToggle={(id) => {
                    if (selectedCategoryIds.includes(id)) {
                      setSelectedCategoryIds(selectedCategoryIds.filter((cid) => cid !== id));
                    } else {
                      setSelectedCategoryIds([...selectedCategoryIds, id]);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={INPUT_CLS}
            placeholder="Nombre del negocio"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={`${INPUT_CLS} resize-none`}
            placeholder="Opcional"
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className={INPUT_CLS}
            placeholder="Dirección del negocio"
          />
        </div>

        {/* Ubicación GPS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ubicación en el mapa
            <span className="text-red-500"> *</span>
          </label>
          <ShopLocationPicker lat={lat} lng={lng} onChange={handleMapChange} />
        </div>

        {/* Configuración */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo estimado (min)</label>
            <input
              type="number"
              min="5"
              value={deliveryTimeMin}
              onChange={(e) => setDeliveryTimeMin(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido mínimo (Bs)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={minimumOrder}
              onChange={(e) => setMinimumOrder(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Propietario — requerido */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Propietario <span className="text-red-500">*</span>
            </p>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                disabled={!hasAvailableAdmins}
                onClick={() => setOwnerMode('existing')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                  effectiveMode === 'existing'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={!hasAvailableAdmins ? 'No hay administradores sin negocio asignado' : undefined}
              >
                <Users size={13} />
                Existente
              </button>
              <button
                type="button"
                onClick={() => setOwnerMode('new')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                  effectiveMode === 'new'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserPlus size={13} />
                Crear nuevo
              </button>
            </div>
          </div>

          {!hasAvailableAdmins && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Todos los administradores ya tienen un negocio asignado. Crea un nuevo propietario.
            </p>
          )}

          {effectiveMode === 'existing' && (
            <select
              value={ownerAccountId}
              onChange={(e) => setOwnerAccountId(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">Seleccionar propietario…</option>
              {availableAdmins.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} — {u.email}
                </option>
              ))}
            </select>
          )}

          {effectiveMode === 'new' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Se creará una cuenta con rol <strong>Admin</strong> y se asignará como propietario.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} className={INPUT_CLS} placeholder="Juan" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} className={INPUT_CLS} placeholder="Pérez" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={INPUT_CLS} placeholder="propietario@ejemplo.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={INPUT_CLS} placeholder="Contraseña de acceso" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                  <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className={INPUT_CLS} placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Antigüedad (desde)</label>
                  <input type="date" value={newStartedAt} onChange={(e) => setNewStartedAt(e.target.value)} className={INPUT_CLS} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            <Save size={15} />
            Crear negocio
          </Button>
        </div>
      </form>
    </div>
  );
}
