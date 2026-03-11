'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/useConfig';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

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
      toast.success(`Configuración "${key}" actualizada`);
    } catch {
      toast.error('Error al guardar configuración');
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Card title="Configuración global del sistema">
        <p className="text-sm text-gray-500 mb-5">
          Estos valores afectan el algoritmo de agrupación y la operación del delivery.
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (configs ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">No hay configuraciones disponibles.</p>
        ) : (
          <div className="space-y-3">
            {(configs ?? []).map((cfg) => {
              const current = editing[cfg.key] ?? cfg.value;
              return (
                <div
                  key={cfg.key}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900">{cfg.key}</p>
                    <p className="text-xs text-gray-400">{cfg.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={current}
                      onChange={(e) => handleChange(cfg.key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSave(cfg.key)}
                      loading={updateConfig.isPending}
                    >
                      <Save size={14} />
                      Guardar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
