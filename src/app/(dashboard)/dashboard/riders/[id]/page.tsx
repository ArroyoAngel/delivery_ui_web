'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRidersList, useRiderLocationDates, useRiderLocationHistory, useRiderDeliveries } from '@/hooks/useConfig';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Bike, Car, Phone, Mail, MapPin, Package, RefreshCw } from 'lucide-react';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const VEHICLE_LABELS: Record<string, string> = { moto: 'Moto', bici: 'Bicicleta', auto: 'Auto' };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Seconds since midnight (local time) for a given ISO timestamp */
function toSeconds(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

/** Parses "lat,lng;lat,lng;..." → [[lng, lat], ...] for Mapbox */
function parsePath(path: string): [number, number][] {
  return path.split(';').map((pt) => {
    const [lat, lng] = pt.split(',').map(Number);
    return [lng, lat];
  });
}

function formatSeconds(s: number): string {
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ── Custom timeline with gap visualization ─────────────────────────────────

interface TimelineSegment {
  fromSec: number;
  toSec: number;
  active: boolean;
}

interface TimelineProps {
  segments: TimelineSegment[];
  minSec: number;
  maxSec: number;
  value: number;
  onChange: (s: number) => void;
}

function Timeline({ segments, minSec, maxSec, value, onChange }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const range = maxSec - minSec || 1;

  const toPercent = (s: number) => ((s - minSec) / range) * 100;

  const handlePointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onChange(Math.round(minSec + pct * range));
  }, [minSec, range, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handlePointer(e);
  }, [handlePointer]);

  return (
    <div
      ref={trackRef}
      className="relative h-4 rounded-full cursor-pointer select-none"
      onPointerDown={handlePointer}
      onPointerMove={handlePointerMove}
    >
      {/* track bg */}
      <div className="absolute inset-y-[5px] inset-x-0 rounded-full bg-gray-200" />

      {/* colored segments */}
      {segments.map((seg, i) => (
        <div
          key={i}
          className={`absolute inset-y-[5px] rounded-full ${seg.active ? 'bg-orange-400' : 'bg-gray-400/40'}`}
          style={{
            left: `${toPercent(seg.fromSec)}%`,
            width: `${toPercent(seg.toSec) - toPercent(seg.fromSec)}%`,
          }}
        />
      ))}

      {/* thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-orange-500 shadow border-2 border-white pointer-events-none"
        style={{ left: `${toPercent(value)}%` }}
      />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function RiderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: riders } = useRidersList();
  const rider = useMemo(() => (riders ?? []).find((r) => r.id === id), [riders, id]);

  const today = todayStr();
  const [date, setDate] = useState('');
  const [sliderSec, setSliderSec] = useState(86399);

  const { data: availableDates = [] } = useRiderLocationDates(id);

  useEffect(() => {
    if (!date && availableDates.length > 0) setDate(availableDates[0]);
    else if (!date) setDate(today);
  }, [availableDates, date, today]);

  const { data: segments = [], isLoading: pointsLoading, refetch: refetchPoints } = useRiderLocationHistory(id, date);
  const { data: deliveries = [], isLoading: deliveriesLoading, refetch: refetchDeliveries } = useRiderDeliveries(id, date);

  // Merge consecutive segments whose gap is ≤ 2× intervalSeconds to avoid
  // false "offline" markers caused by the 5-minute flush window.
  const fusedSegments = useMemo(() => {
    if (segments.length === 0) return [];
    const result: typeof segments = [{ ...segments[0] }];
    for (let i = 1; i < segments.length; i++) {
      const prev = result[result.length - 1];
      const curr = segments[i];
      const gapSec = (new Date(curr.startedAt).getTime() - new Date(prev.endedAt).getTime()) / 1000;
      const threshold = 2 * (prev.intervalSeconds ?? 5);
      if (gapSec <= threshold) {
        prev.path = prev.path + ';' + curr.path;
        prev.endedAt = curr.endedAt;
      } else {
        result.push({ ...curr });
      }
    }
    return result;
  }, [segments]);

  // Per-segment annotated coords (NOT flattened — keeps segments separate)
  const segmentData = useMemo(() =>
    fusedSegments.map((s) => {
      const base = toSeconds(s.startedAt);
      const endSec = toSeconds(s.endedAt);
      const coords = parsePath(s.path).map((coord, i) => ({
        coord,
        sec: base + i * (s.intervalSeconds ?? 5),
      }));
      return { coords, startSec: base, endSec };
    }),
  [fusedSegments]);

  const totalCoords = segmentData.reduce((acc, s) => acc + s.coords.length, 0);
  const minSec = segmentData[0]?.startSec ?? 0;
  const maxSec = segmentData[segmentData.length - 1]?.endSec ?? 86399;

  // Reset slider on new data
  useEffect(() => { setSliderSec(maxSec); }, [maxSec]);

  // Timeline segments (active + gap)
  const timelineSegments = useMemo((): TimelineSegment[] => {
    if (segmentData.length === 0) return [];
    const result: TimelineSegment[] = [];
    segmentData.forEach((seg, i) => {
      result.push({ fromSec: seg.startSec, toSec: seg.endSec, active: true });
      if (i < segmentData.length - 1) {
        result.push({ fromSec: seg.endSec, toSec: segmentData[i + 1].startSec, active: false });
      }
    });
    return result;
  }, [segmentData]);

  // Per-segment visible coords (no cross-segment connection)
  const visibleLines = useMemo(() =>
    segmentData
      .map((s) => s.coords.filter((p) => p.sec <= sliderSec).map((p) => p.coord))
      .filter((line) => line.length >= 2),
  [segmentData, sliderSec]);

  const visibleAllCoords = useMemo(() =>
    segmentData.flatMap((s) => s.coords.filter((p) => p.sec <= sliderSec).map((p) => p.coord)),
  [segmentData, sliderSec]);

  const dateOptions = availableDates.length > 0 ? availableDates : [today];

  // ── Mapbox ────────────────────────────────────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    import('mapbox-gl').then((mapboxgl) => {
      if (!mapContainerRef.current) return;
      mapboxgl.default.accessToken = token;
      const map = new mapboxgl.default.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-63.18, -17.78],
        zoom: 13,
      });
      map.on('load', () => {
        // MultiLineString source for route (no cross-segment lines)
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'MultiLineString', coordinates: [] }, properties: {} },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#f97316', 'line-width': 4, 'line-opacity': 0.9 },
        });
        map.addSource('points', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
          id: 'points-start',
          type: 'circle',
          source: 'points',
          filter: ['==', ['get', 'type'], 'start'],
          paint: { 'circle-radius': 8, 'circle-color': '#22c55e', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
        });
        map.addLayer({
          id: 'points-end',
          type: 'circle',
          source: 'points',
          filter: ['==', ['get', 'type'], 'end'],
          paint: { 'circle-radius': 8, 'circle-color': '#ef4444', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
        });
        setMapLoaded(true);
      });
      mapRef.current = map;
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // Resize map when loading state changes (was invisible, now visible)
  useEffect(() => {
    if (!pointsLoading && mapRef.current) {
      setTimeout(() => mapRef.current?.resize(), 50);
    }
  }, [pointsLoading]);

  // Update route whenever visible lines change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const routeSrc = map.getSource('route');
    if (routeSrc) {
      routeSrc.setData({
        type: 'Feature',
        geometry: { type: 'MultiLineString', coordinates: visibleLines },
        properties: {},
      });
    }

    const features: any[] = [];
    if (visibleAllCoords.length > 0) {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: visibleAllCoords[0] }, properties: { type: 'start' } });
      if (visibleAllCoords.length > 1) {
        features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: visibleAllCoords[visibleAllCoords.length - 1] }, properties: { type: 'end' } });
      }
    }
    const ptsSrc = map.getSource('points');
    if (ptsSrc) ptsSrc.setData({ type: 'FeatureCollection', features });

    if (visibleAllCoords.length >= 2) {
      const lngs = visibleAllCoords.map((c) => c[0]);
      const lats = visibleAllCoords.map((c) => c[1]);
      map.fitBounds(
        [[Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005], [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]],
        { padding: 60, duration: 800 },
      );
    }
  }, [visibleLines, visibleAllCoords, mapLoaded]);

  if (!rider && riders) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <MapPin size={36} className="mb-3 opacity-30" />
      <p className="text-sm">Repartidor no encontrado</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900">
            {rider ? `${rider.firstName} ${rider.lastName}` : '…'}
          </h1>
          <p className="text-xs text-gray-400">Historial de recorrido</p>
        </div>
        {rider && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rider.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {rider.isAvailable ? 'Activo' : 'Desconectado'}
          </span>
        )}
      </div>

      {/* Rider info card */}
      {rider && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg flex-shrink-0">
            {`${rider.firstName?.[0] ?? ''}${rider.lastName?.[0] ?? ''}`.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-[160px]">
            <p className="font-semibold text-gray-900">{rider.firstName} {rider.lastName}</p>
            <div className="flex flex-wrap gap-3 mt-1">
              {rider.phone && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={11} />{rider.phone}</span>}
              <span className="flex items-center gap-1 text-xs text-gray-500"><Mail size={11} />{rider.email}</span>
              {rider.vehicleType && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  {rider.vehicleType === 'auto' ? <Car size={11} /> : <Bike size={11} />}
                  {VEHICLE_LABELS[rider.vehicleType] ?? rider.vehicleType}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Registrado</p>
            <p className="text-sm text-gray-600">{formatDate(rider.createdAt)}</p>
          </div>
        </div>
      )}

      {/* Date selector + refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-700">Fecha:</label>
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
        >
          {dateOptions.map((d) => (
            <option key={d} value={d}>{d === today ? `${d} (hoy)` : d}</option>
          ))}
        </select>
        <button
          onClick={() => { refetchPoints(); refetchDeliveries(); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          title="Actualizar"
        >
          <RefreshCw size={14} />
        </button>
        <span className="text-xs text-gray-400 ml-auto">
          {totalCoords} punto{totalCoords !== 1 ? 's' : ''} de GPS · {deliveries.length} entrega{deliveries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Map — always rendered, spinner overlaid while loading */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative" style={{ height: 420 }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        {pointsLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <PageLoader />
          </div>
        )}
        {!pointsLoading && segments.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white/90 rounded-xl px-4 py-3 text-sm text-gray-500 shadow">
              Sin datos de recorrido para este día
            </div>
          </div>
        )}
      </div>

      {/* Timeline with gap visualization */}
      {segments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">Línea de tiempo</span>
            <span className="text-xs text-orange-600 font-mono font-semibold">{formatSeconds(sliderSec)}</span>
          </div>

          <Timeline
            segments={timelineSegments}
            minSec={minSec}
            maxSec={maxSec}
            value={sliderSec}
            onChange={setSliderSec}
          />

          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>{formatSeconds(minSec)}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2 rounded-sm bg-orange-400" /> activo
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2 rounded-sm bg-gray-400/40" /> desconectado
              </span>
            </div>
            <span>{formatSeconds(maxSec)}</span>
          </div>
        </div>
      )}

      {/* Deliveries */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Package size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">
            Entregas del día {deliveries.length > 0 ? `(${deliveries.length})` : ''}
          </span>
        </div>
        {deliveriesLoading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Cargando…</div>
        ) : deliveries.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">Sin entregas registradas este día</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {deliveries.map((d) => (
              <li key={d.id} className="flex items-start gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package size={13} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{d.restaurantName}</p>
                  <p className="text-xs text-gray-400 truncate">{d.deliveryAddress}</p>
                  <p className="text-xs text-gray-300">{new Date(d.deliveredAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{formatCurrency(d.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
