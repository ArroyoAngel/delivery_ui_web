'use client';

import { useEffect, useRef } from 'react';
import { LocateFixed, MapPin, X } from 'lucide-react';

interface ShopLocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
}

const DEFAULT_LAT = -17.7833;
const DEFAULT_LNG = -63.1812;

export default function ShopLocationPicker({ lat, lng, onChange }: ShopLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('mapbox-gl').Map | null>(null);
  const markerRef = useRef<import('mapbox-gl').Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const token =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    '';

  useEffect(() => {
    if (!containerRef.current || !token) return;
    let cancelled = false;

    async function init() {
      await import('mapbox-gl/dist/mapbox-gl.css');
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [DEFAULT_LNG, DEFAULT_LAT],
        zoom: 13,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      function placeMarker(la: number, lo: number) {
        if (!markerRef.current) {
          markerRef.current = new mapboxgl.Marker({ color: '#f97316', draggable: true })
            .setLngLat([lo, la])
            .addTo(map);

          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLngLat();
            onChangeRef.current(
              Math.round(pos.lat * 1e7) / 1e7,
              Math.round(pos.lng * 1e7) / 1e7,
            );
          });
        } else {
          markerRef.current.setLngLat([lo, la]);
        }
        onChangeRef.current(
          Math.round(la * 1e7) / 1e7,
          Math.round(lo * 1e7) / 1e7,
        );
      }

      // If props already have coords (e.g. editing), place marker immediately
      if (lat !== null && lng !== null) {
        map.on('load', () => placeMarker(lat!, lng!));
        map.setCenter([lng!, lat!]);
      }

      map.on('click', (e) => {
        placeMarker(e.lngLat.lat, e.lngLat.lng);
        map.panTo([e.lngLat.lng, e.lngLat.lat]);
      });
    }

    void init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Sync marker when lat/lng change from outside (manual number inputs)
  useEffect(() => {
    if (lat !== null && lng !== null && markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current?.panTo([lng, lat]);
    }
  }, [lat, lng]);

  function handleLocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const la = Math.round(coords.latitude * 1e7) / 1e7;
      const lo = Math.round(coords.longitude * 1e7) / 1e7;
      onChangeRef.current(la, lo);
      const map = mapRef.current;
      if (!map) return;
      const mapboxgl_Marker = markerRef.current;
      if (mapboxgl_Marker) {
        mapboxgl_Marker.setLngLat([lo, la]);
      } else {
        import('mapbox-gl').then(({ default: mapboxgl }) => {
          markerRef.current = new mapboxgl.Marker({ color: '#f97316', draggable: true })
            .setLngLat([lo, la])
            .addTo(map);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLngLat();
            onChangeRef.current(
              Math.round(pos.lat * 1e7) / 1e7,
              Math.round(pos.lng * 1e7) / 1e7,
            );
          });
        });
      }
      map.flyTo({ center: [lo, la], zoom: 15, duration: 800 });
    });
  }

  function handleClear() {
    markerRef.current?.remove();
    markerRef.current = null;
    onChangeRef.current(null, null);
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Falta <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> en .env para ver el mapa.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-gray-200">
        <div ref={containerRef} className="w-full h-[280px]" />

        {/* Top-left controls */}
        <button
          type="button"
          onClick={handleLocate}
          className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md px-3 py-2 text-xs font-medium text-gray-700 flex items-center gap-1.5 hover:bg-gray-50 transition-all"
        >
          <LocateFixed size={14} className="text-orange-500" />
          Mi ubicación
        </button>

        {/* Crosshair at map center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative w-6 h-6">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500/50 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500/50 -translate-y-1/2" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-600/60" />
          </div>
        </div>

        {/* Coordinate badge — only visible when a point is set */}
        {lat !== null && lng !== null ? (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-white rounded-lg shadow-md px-3 py-1.5 text-xs text-gray-700 flex items-center gap-2">
            <MapPin size={12} className="text-orange-500 flex-shrink-0" />
            <span className="font-mono tabular-nums">{lat}, {lng}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Quitar ubicación"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-gray-400 shadow pointer-events-none">
            Haz clic en el mapa para fijar la ubicación
          </div>
        )}
      </div>
    </div>
  );
}
