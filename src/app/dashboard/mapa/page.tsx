"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/src/components/layout/TopBar";
import { Badge } from "@/src/components/ui/badge";
import { mockTransformers } from "@/src/data/mockData";
import { useAdminAuth } from "@/src/context/AdminAuthContext";
import type { Transformer, TransformerStatus } from "@/src/types";
import { AlertTriangle, Zap, MapPin } from "lucide-react";

const statusColors: Record<TransformerStatus, string> = {
  Disponible: "#22c55e",
  Condicionada: "#f59e0b",
  Crítica: "#ef4444",
  Saturada: "#7f1d1d",
};

const statusBadgeVariant: Record<TransformerStatus, "success" | "warning" | "destructive"> = {
  Disponible: "success",
  Condicionada: "warning",
  Crítica: "destructive",
  Saturada: "destructive",
};

export default function MapaPage() {
  const { session } = useAdminAuth();
  const ede = session?.ede;
  const edeColors: Record<string, string> = {
    EDESUR: "#135bec",
    EDENORTE: "#f59e0b",
    EDEESTE: "#22c55e",
  };
  const edeColor = ede ? (edeColors[ede] ?? "#135bec") : "#135bec";

  const myTransformers = ede
    ? mockTransformers.filter((t) => t.distributorName === ede)
    : mockTransformers;

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [selected, setSelected] = useState<Transformer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Center map on the EDE's transformers
  const centerLat = myTransformers.length
    ? myTransformers.reduce((s, t) => s + t.lat, 0) / myTransformers.length
    : 18.735;
  const centerLng = myTransformers.length
    ? myTransformers.reduce((s, t) => s + t.lng, 0) / myTransformers.length
    : -70.163;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let map: {
      remove: () => void;
      on: (event: string, cb: () => void) => void;
      addSource: (id: string, source: object) => void;
      addLayer: (layer: object) => void;
      getSource: (id: string) => { setData: (data: object) => void } | undefined;
      queryRenderedFeatures: (
        point: [number, number],
        options: object
      ) => Array<{ properties: Record<string, unknown> }>;
    };

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      // CSS loaded via global import in layout

      map = new maplibregl.Map({
        container: mapRef.current!,
        style: "https://demotiles.maplibre.org/style.json",
        center: [centerLng, centerLat],
        zoom: 8,
      }) as typeof map;

      mapInstanceRef.current = map;

      map.on("load", () => {
        setMapLoaded(true);

        const geojson = {
          type: "FeatureCollection",
          features: myTransformers.map((t) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [t.lng, t.lat] },
            properties: {
              id: t.id,
              code: t.code,
              status: t.status,
              zone: t.serviceZone,
              total: t.totalCapacityKva,
              available: t.availableCapacityKva,
              percent: t.availabilityPercent,
              color: statusColors[t.status],
            },
          })),
        };

        map.addSource("transformers", { type: "geojson", data: geojson });

        // Circle layer
        map.addLayer({
          id: "transformer-circles",
          type: "circle",
          source: "transformers",
          paint: {
            "circle-radius": 12,
            "circle-color": ["get", "color"],
            "circle-opacity": 0.9,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Label layer
        map.addLayer({
          id: "transformer-labels",
          type: "symbol",
          source: "transformers",
          layout: {
            "text-field": ["get", "percent"],
            "text-size": 10,
            "text-font": ["Open Sans Bold"],
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        // Click handler
        (map as unknown as {
          on: (event: string, layer: string, cb: (e: { point: [number, number] }) => void) => void;
        }).on("click", "transformer-circles", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["transformer-circles"],
          });
          if (!features.length) return;
          const props = features[0].properties;
          const transformer = myTransformers.find((t) => t.id === Number(props.id));
          if (transformer) setSelected(transformer);
        });
      });
    })();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byStatus = (s: TransformerStatus) => myTransformers.filter((t) => t.status === s).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Mapa de Transformadores"
        subtitle={`Red de distribución ${ede ?? ""} · Vista geográfica`}
      />

      <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
        {/* Legend + Summary */}
        <div className="flex flex-wrap items-center gap-3">
          {(["Disponible", "Condicionada", "Crítica", "Saturada"] as TransformerStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: statusColors[s] }}
              />
              <span className="text-sm text-muted-foreground">{s}</span>
              <span className="text-sm font-bold">{byStatus(s)}</span>
            </div>
          ))}
          <span className="ml-auto text-sm text-muted-foreground">
            {myTransformers.length} transformador{myTransformers.length !== 1 ? "es" : ""} en tu red
          </span>
        </div>

        {/* Map + Sidebar */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Map */}
          <div className="flex-1 relative rounded-xl overflow-hidden border border-border">
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5 animate-pulse" />
                  <span className="text-sm">Cargando mapa...</span>
                </div>
              </div>
            )}
          </div>

          {/* Transformer List Panel */}
          <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
            <p className="text-sm font-medium text-muted-foreground px-1">Transformadores</p>
            {myTransformers.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(selected?.id === t.id ? null : t)}
                className={`w-full text-left bg-card border rounded-xl p-3 transition-all hover:shadow-sm ${
                  selected?.id === t.id
                    ? "border-2 shadow-sm"
                    : "border-border"
                }`}
                style={selected?.id === t.id ? { borderColor: edeColor } : {}}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: statusColors[t.status] }}
                    />
                    <p className="font-mono text-xs font-semibold truncate">{t.code}</p>
                  </div>
                  <Badge variant={statusBadgeVariant[t.status]} className="text-xs shrink-0">
                    {t.availabilityPercent}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 pl-4">{t.serviceZone}</p>
                <div className="mt-2 pl-4">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(t.availabilityPercent, 2)}%`,
                        backgroundColor: statusColors[t.status],
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                    <span>{t.availableCapacityKva} kVA</span>
                    <span>{t.totalCapacityKva} kVA</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Transformer Detail */}
        {selected && (
          <div
            className="rounded-xl border-2 p-4 bg-card"
            style={{ borderColor: statusColors[selected.status] }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                  style={{ backgroundColor: `${statusColors[selected.status]}20` }}
                >
                  {selected.status === "Crítica" || selected.status === "Saturada" ? (
                    <AlertTriangle className="w-5 h-5" style={{ color: statusColors[selected.status] }} />
                  ) : (
                    <Zap className="w-5 h-5" style={{ color: statusColors[selected.status] }} />
                  )}
                </div>
                <div>
                  <p className="font-mono font-bold">{selected.code}</p>
                  <p className="text-sm text-muted-foreground">{selected.serviceZone}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm flex-wrap">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: statusColors[selected.status] }}>
                    {selected.availabilityPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">Disponibilidad</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{selected.availableCapacityKva}</p>
                  <p className="text-xs text-muted-foreground">kVA disponible</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{selected.totalCapacityKva}</p>
                  <p className="text-xs text-muted-foreground">kVA total</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground">Coordenadas</p>
                </div>
                <Badge variant={statusBadgeVariant[selected.status]} className="text-sm px-3 py-1">
                  {selected.status}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
