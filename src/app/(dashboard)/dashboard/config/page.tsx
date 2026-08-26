'use client';

import { useRef, useState } from 'react';
import { Save, Upload } from 'lucide-react';
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/useConfig';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ── Field type map ─────────────────────────────────────────────────────────────

type FieldType = 'number' | 'time' | 'boolean' | 'url' | 'text' | 'image-upload';

const FIELD_TYPES: Record<string, FieldType> = {
  nearby_shop_radius_meters:  'number',
  max_orders_per_group:       'number',
  group_wait_minutes:         'number',
  location_interval_seconds:  'number',
  platform_service_fee:       'number',
  minimum_withdrawal_amount:  'number',
  delivery_fee:               'number',
  express_fee:                'number',
  app_service_fee:            'number',
  shop_commission_pct:        'number',
  support_hours_start:        'time',
  support_hours_end:          'time',
  support_enabled:            'boolean',
  allow_inactive_shop_login:  'boolean',
  max_bag_size:               'number',
  platform_qr_image_url:      'image-upload',
};

// ── Grouping definition ────────────────────────────────────────────────────────

const GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Agrupación de pedidos',
    keys: ['nearby_shop_radius_meters', 'max_orders_per_group', 'group_wait_minutes', 'max_bag_size'],
  },
  {
    label: 'GPS y tracking',
    keys: ['location_interval_seconds'],
  },
  {
    label: 'Tarifas del servicio',
    keys: ['delivery_fee', 'express_fee', 'app_service_fee', 'shop_commission_pct', 'platform_service_fee'],
  },
  {
    label: 'Retiros',
    keys: ['minimum_withdrawal_amount'],
  },
  {
    label: 'Membresías y acceso',
    keys: ['allow_inactive_shop_login'],
  },
  {
    label: 'Cuenta bancaria de la plataforma',
    keys: ['platform_bank_name', 'platform_bank_account_holder', 'platform_bank_account_number', 'platform_qr_image_url'],
  },
  {
    label: 'Soporte al cliente',
    keys: ['support_enabled', 'support_hours_start', 'support_hours_end'],
  },
];

// ── Boolean toggle ─────────────────────────────────────────────────────────────

function BooleanToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isOn = value === 'true';
  return (
    <button
      type="button"
      onClick={() => onChange(isOn ? 'false' : 'true')}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isOn ? 'bg-orange-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          isOn ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ── Image upload field ─────────────────────────────────────────────────────────

function ImageUploadField({
  cfgKey,
  current,
  onChange,
  onSave,
  saving,
}: {
  cfgKey: string;
  current: string;
  onChange: (key: string, value: string) => void;
  onSave: (key: string) => void;
  saving: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post<{ url: string }>('/api/config/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(cfgKey, data.url);
      toast.success('Imagen subida — presiona Guardar para confirmar');
    } catch {
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      {current && (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt="QR preview"
            className="h-32 w-32 object-contain rounded-lg border border-gray-200 bg-gray-50"
          />
          <p className="text-xs text-gray-400 break-all">{current}</p>
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          loading={uploading}
        >
          <Upload size={14} />
          {current ? 'Cambiar imagen' : 'Subir imagen'}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSave(cfgKey)}
          loading={saving}
          disabled={!current}
        >
          <Save size={14} />
          Guardar
        </Button>
      </div>
    </div>
  );
}

// ── Field component ────────────────────────────────────────────────────────────

function ConfigField({
  cfg,
  editing,
  onChange,
  onSave,
  saving,
}: {
  cfg: { key: string; value: string; description?: string };
  editing: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave: (key: string) => void;
  saving: boolean;
}) {
  const current = editing[cfg.key] ?? cfg.value;
  const fieldType: FieldType = FIELD_TYPES[cfg.key] ?? 'text';

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-900">{cfg.key}</p>
        <p className="text-xs text-gray-400">{cfg.description}</p>
      </div>

      {fieldType === 'boolean' ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {current === 'true' ? 'Habilitado' : 'Deshabilitado'}
          </span>
          <div className="flex items-center gap-3">
            <BooleanToggle value={current} onChange={(v) => onChange(cfg.key, v)} />
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSave(cfg.key)}
              loading={saving}
            >
              <Save size={14} />
              Guardar
            </Button>
          </div>
        </div>
      ) : fieldType === 'image-upload' ? (
        <ImageUploadField
          cfgKey={cfg.key}
          current={current}
          onChange={onChange}
          onSave={onSave}
          saving={saving}
        />
      ) : (
        <div className="flex gap-2">
          <input
            type={fieldType === 'number' ? 'number' : fieldType === 'time' ? 'time' : fieldType === 'url' ? 'url' : 'text'}
            step={fieldType === 'number' ? 'any' : undefined}
            min={fieldType === 'number' ? '0' : undefined}
            value={current}
            onChange={(e) => onChange(cfg.key, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSave(cfg.key)}
            loading={saving}
          >
            <Save size={14} />
            Guardar
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  const { data: configs, isLoading } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();
  const [editing, setEditing] = useState<Record<string, string>>({});

  function handleChange(key: string, value: string) {
    setEditing((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(key: string) {
    const value = editing[key];
    if (value === undefined) return;
    try {
      await updateConfig.mutateAsync({ key, value });
      toast.success(`"${key}" actualizado`);
    } catch {
      toast.error('Error al guardar configuración');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const allConfigs = configs ?? [];
  const knownKeys = new Set(GROUPS.flatMap((g) => g.keys));
  const otherConfigs = allConfigs.filter((c) => !knownKeys.has(c.key));

  return (
    <div className="space-y-5 max-w-3xl">
      {GROUPS.map((group) => {
        const groupConfigs = group.keys
          .map((k) => allConfigs.find((c) => c.key === k))
          .filter(Boolean) as typeof allConfigs;

        if (groupConfigs.length === 0) return null;

        return (
          <Card key={group.label} title={group.label}>
            <div className="space-y-3">
              {groupConfigs.map((cfg) => (
                <ConfigField
                  key={cfg.key}
                  cfg={cfg}
                  editing={editing}
                  onChange={handleChange}
                  onSave={handleSave}
                  saving={updateConfig.isPending}
                />
              ))}
            </div>
          </Card>
        );
      })}

      {otherConfigs.length > 0 && (
        <Card title="Otros">
          <div className="space-y-3">
            {otherConfigs.map((cfg) => (
              <ConfigField
                key={cfg.key}
                cfg={cfg}
                editing={editing}
                onChange={handleChange}
                onSave={handleSave}
                saving={updateConfig.isPending}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
