'use client';

import { useEffect, useRef } from 'react';
import type { Restaurant } from '@/models';

interface RestaurantsMapProps {
  restaurants: Restaurant[];
  selectedId?: string;
  onSelect: (r: Restaurant) => void;
}

export default function RestaurantsMap({ restaurants, selectedId, onSelect }: RestaurantsMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const token =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    '';

  useEffect(() => {
    if (!mapRef.current || !token) return;
    let map: import('mapbox-gl').Map | null = null;

    const withCoords = restaurants.filter(
      (r) => r.latitude && r.longitude && !(r.latitude === 0 && r.longitude === 0),
    );

    async function init() {
      if (!mapRef.current) return;
      const mapboxgl = (await import('mapbox-gl')).default;
      mapboxgl.accessToken = token;

      // Default to Santa Cruz de la Sierra
      const center: [number, number] =
        withCoords.length > 0
          ? [Number(withCoords[0].longitude), Number(withCoords[0].latitude)]
          : [-63.1812, -17.7833];

      map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center,
        zoom: 13,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        if (!map) return;

        for (const r of withCoords) {
          const isSelected = r.id === selectedId;
          const el = document.createElement('div');
          el.style.cssText = `
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            border-radius: 50%;
            background: ${isSelected ? '#ea580c' : '#f97316'};
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
            transition: all 0.2s;
          `;
          el.innerHTML = '🍽️';
          el.title = r.name;
          el.addEventListener('click', () => onSelect(r));

          new mapboxgl.Marker({ element: el })
            .setLngLat([Number(r.longitude), Number(r.latitude)])
            .setPopup(
              new mapboxgl.Popup({ offset: 20 }).setHTML(
                `<div style="font-size:13px;font-weight:600">${r.name}</div>
                 <div style="font-size:11px;color:#6b7280">${r.address}</div>
                 <div style="font-size:11px;margin-top:4px">⭐ ${Number(r.rating).toFixed(1)} · ${r.isOpen ? '✅ Abierto' : '🔴 Cerrado'}</div>`,
              ),
            )
            .addTo(map!);
        }

        if (withCoords.length > 1) {
          const bounds = new mapboxgl.LngLatBounds();
          for (const r of withCoords) bounds.extend([Number(r.longitude), Number(r.latitude)]);
          map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
        }
      });
    }

    void init();
    return () => { if (map) map.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, selectedId, token]);

  if (!token) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Falta NEXT_PUBLIC_MAPBOX_TOKEN en .env para ver el mapa.
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-[400px] rounded-xl overflow-hidden" />;
}
