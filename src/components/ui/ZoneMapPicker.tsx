'use client';

import { useEffect, useRef, useCallback } from 'react';
import { LocateFixed } from 'lucide-react';

interface ZoneMapPickerProps {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  onCenterChange: (lat: number, lng: number) => void;
}

/** Generate a polygon approximating a circle around (lat, lng) with given radius in meters. */
function makeCirclePolygon(lat: number, lng: number, radiusMeters: number, steps = 64): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusMeters / 111_320) * Math.cos(angle);
    const dLng = (radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([lng + dLng, lat + dLat]);
  }
  return coords;
}

export default function ZoneMapPicker({
  centerLat,
  centerLng,
  radiusMeters,
  onCenterChange,
}: ZoneMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('mapbox-gl').Map | null>(null);
  const markerRef = useRef<import('mapbox-gl').Marker | null>(null);

  // Keep mutable refs so event handlers inside the init closure always see fresh values
  const radiusRef = useRef(radiusMeters);
  const onCenterRef = useRef(onCenterChange);
  useEffect(() => { radiusRef.current = radiusMeters; }, [radiusMeters]);
  useEffect(() => { onCenterRef.current = onCenterChange; }, [onCenterChange]);

  const token =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    '';

  const updateCircle = useCallback((lat: number, lng: number, radius: number) => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('zone-circle') as import('mapbox-gl').GeoJSONSource | undefined;
    if (!src) return;
    src.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [makeCirclePolygon(lat, lng, radius)],
      },
    });
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || !token) return;
    let cancelled = false;

    const initLat = centerLat || -17.7833;
    const initLng = centerLng || -63.1812;

    async function init() {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [initLng, initLat],
        zoom: 12,
      });
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      // Draggable center marker
      const marker = new mapboxgl.Marker({ color: '#f97316', draggable: true })
        .setLngLat([initLng, initLat])
        .addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLngLat();
        onCenterRef.current(lat, lng);
        updateCircle(lat, lng, radiusRef.current);
      });

      // Click on map to move center
      map.on('click', (e) => {
        const { lat, lng } = e.lngLat;
        marker.setLngLat([lng, lat]);
        onCenterRef.current(lat, lng);
        updateCircle(lat, lng, radiusRef.current);
      });

      map.on('load', () => {
        if (cancelled) return;
        map.addSource('zone-circle', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [makeCirclePolygon(initLat, initLng, radiusRef.current)],
            },
          },
        });
        map.addLayer({
          id: 'zone-circle-fill',
          type: 'fill',
          source: 'zone-circle',
          paint: { 'fill-color': '#f97316', 'fill-opacity': 0.15 },
        });
        map.addLayer({
          id: 'zone-circle-stroke',
          type: 'line',
          source: 'zone-circle',
          paint: { 'line-color': '#ea580c', 'line-width': 2.5, 'line-dasharray': [2, 1] },
        });
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

  // Sync circle + marker when props change from outside (e.g. slider, manual input)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      updateCircle(centerLat, centerLng, radiusMeters);
      markerRef.current?.setLngLat([centerLng, centerLat]);
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [centerLat, centerLng, radiusMeters, updateCircle]);

  function handleLocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { latitude: lat, longitude: lng } = coords;
      onCenterRef.current(lat, lng);
      markerRef.current?.setLngLat([lng, lat]);
      updateCircle(lat, lng, radiusRef.current);
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, duration: 800 });
    });
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Falta <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> en .env para ver el mapa.
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200">
      <div ref={containerRef} className="w-full h-[300px]" />
      {/* Locate button */}
      <button
        type="button"
        onClick={handleLocate}
        className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md px-3 py-2 text-xs font-medium text-gray-700 flex items-center gap-1.5 hover:bg-gray-50 transition-all"
        title="Centrar en mi ubicación"
      >
        <LocateFixed size={14} className="text-orange-500" />
        Mi ubicación
      </button>
      {/* Hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-gray-500 shadow pointer-events-none">
        Haz clic en el mapa o arrastra el marcador para definir el centro
      </div>
    </div>
  );
}
