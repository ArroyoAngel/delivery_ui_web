'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { Order } from '@/models';
import Button from '@/components/ui/Button';
import 'mapbox-gl/dist/mapbox-gl.css';

type ViewMode = 'orders' | 'products';

interface SalesHeatmapProps {
  orders: Order[];
  viewMode: ViewMode;
}

interface WeightProps {
  weight: number;
  total: number;
  products: number;
}

function buildGeoJson(orders: Order[], viewMode: ViewMode): FeatureCollection<Point, WeightProps> {
  const paidStatuses = new Set(['confirmado', 'preparando', 'listo', 'en_camino', 'entregado']);
  const features: Array<Feature<Point, WeightProps>> = [];

  for (const order of orders) {
    if (!paidStatuses.has(order.status)) continue;
    const lat = Number(order.deliveryLat);
    const lng = Number(order.deliveryLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue;

    const products = (order.items ?? []).reduce((acc, it) => acc + Number(it.quantity ?? 0), 0);
    const weight = viewMode === 'products' ? Math.max(1, products) : 1;

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        weight,
        total: Number(order.total ?? 0),
        products,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

function HeatmapMap({ geojson, token, heightClass }: { geojson: FeatureCollection<Point, WeightProps>; token: string; heightClass: string }) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: import('mapbox-gl').Map | null = null;

    async function init() {
      if (!mapRef.current) return;
      const mapboxgl = (await import('mapbox-gl')).default;
      mapboxgl.accessToken = token;

      map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-68.1193, -16.4897], // La Paz default
        zoom: 11,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        if (!map) return;

        map.addSource('sales-points', {
          type: 'geojson',
          data: geojson,
        });

        map.addLayer({
          id: 'sales-heat',
          type: 'heatmap',
          source: 'sales-points',
          maxzoom: 13,
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.8, 13, 2],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(241,245,249,0)',
              0.2,
              '#fde68a',
              0.4,
              '#fb923c',
              0.7,
              '#f97316',
              1,
              '#9a3412',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 10, 13, 28],
            'heatmap-opacity': 0.85,
          },
        });

        map.addLayer({
          id: 'sales-points-circle',
          type: 'circle',
          source: 'sales-points',
          minzoom: 11,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 16, 9],
            'circle-color': '#ea580c',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-opacity': 0.75,
          },
        });

        const bounds = new mapboxgl.LngLatBounds();
        for (const f of geojson.features) {
          bounds.extend(f.geometry.coordinates as [number, number]);
        }
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 45, maxZoom: 14, duration: 500 });
        }
      });
    }

    void init();

    return () => {
      if (map) map.remove();
    };
  }, [geojson, token]);

  return <div ref={mapRef} className={`w-full rounded-xl overflow-hidden ${heightClass}`} />;
}

export default function SalesHeatmap({ orders, viewMode }: SalesHeatmapProps) {
  const [fullOpen, setFullOpen] = useState(false);
  const token =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    '';

  const geojson = useMemo(() => buildGeoJson(orders, viewMode), [orders, viewMode]);

  if (!token) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Falta configurar Mapbox. Agrega NEXT_PUBLIC_MAPBOX_TOKEN (o NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) en tu .env para ver el mapa de calor.
      </div>
    );
  }

  if (!geojson.features.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
        No hay coordenadas de entrega suficientes para construir el mapa de calor en este modo.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Intensidad por zona en modo {viewMode === 'orders' ? 'pedidos' : 'productos'}.
          </p>
          <Button size="sm" variant="secondary" onClick={() => setFullOpen(true)}>
            Ver pantalla completa
          </Button>
        </div>
        <HeatmapMap geojson={geojson} token={token} heightClass="h-[380px]" />
      </div>

      {fullOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 p-4 sm:p-6">
          <div className="h-full w-full rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Mapa de calor por zona ({viewMode === 'orders' ? 'pedidos' : 'productos'})
              </h3>
              <Button size="sm" variant="secondary" onClick={() => setFullOpen(false)}>
                Cerrar
              </Button>
            </div>
            <div className="flex-1 p-3">
              <HeatmapMap geojson={geojson} token={token} heightClass="h-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
