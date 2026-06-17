"use client";

import { useState, useEffect, useCallback } from "react";
import { Sun, Search, RefreshCw, TrendingUp, Leaf, DollarSign, Zap } from "lucide-react";
import { TopBar } from "@/src/components/layout/TopBar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { useAdminAuth } from "@/src/context/AdminAuthContext";
import type { StoredSimulation } from "@/src/types";

const viabilidadVariant: Record<string, "success" | "warning" | "info" | "destructive"> = {
  excelente: "success",
  buena: "info",
  moderada: "warning",
  limitada: "destructive",
};

const viabilidadLabel: Record<string, string> = {
  excelente: "Excelente",
  buena: "Buena",
  moderada: "Moderada",
  limitada: "Limitada",
};

export default function SimulacionesPage() {
  const { session } = useAdminAuth();
  const edeColors: Record<string, string> = {
    EDESUR: "#135bec",
    EDENORTE: "#f59e0b",
    EDEESTE: "#22c55e",
  };
  const edeColor = session?.ede ? (edeColors[session.ede] ?? "#135bec") : "#135bec";

  const [simulations, setSimulations] = useState<StoredSimulation[]>([]);
  const [search, setSearch] = useState("");
  const [filterViab, setFilterViab] = useState("Todas");
  const [filterCategoria, setFilterCategoria] = useState("Todas");

  const fetchSimulations = useCallback(async () => {
    const res = await fetch("/api/simulations");
    if (res.ok) setSimulations(await res.json());
  }, []);

  useEffect(() => { fetchSimulations(); }, [fetchSimulations]);

  const filtered = simulations.filter((s) => {
    const matchSearch =
      s.ubicacion.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    const matchViab = filterViab === "Todas" || s.viabilidad === filterViab;
    const matchCat = filterCategoria === "Todas" || s.categoria === filterCategoria;
    return matchSearch && matchViab && matchCat;
  });

  const formatPesos = (n: number) =>
    new Intl.NumberFormat("es-DO", { maximumFractionDigits: 0 }).format(n);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // KPI summary
  const totalKwp = simulations.reduce((s, sim) => s + sim.tamanoSistemaKwp, 0);
  const totalAhorro = simulations.reduce((s, sim) => s + sim.ahorroMensual, 0);
  const totalCO2 = simulations.reduce((s, sim) => s + sim.co2EvitadoAnual, 0);
  const excelentes = simulations.filter((s) => s.viabilidad === "excelente").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Simulaciones de Net Metering"
        subtitle="Consultas realizadas por usuarios desde el portal público"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Simulaciones",
              value: simulations.length,
              icon: Sun,
              bg: "bg-amber-50 dark:bg-amber-900/20",
              color: "text-amber-600",
            },
            {
              label: "Capacidad Total Estimada",
              value: `${totalKwp.toFixed(1)} kWp`,
              icon: Zap,
              bg: "bg-blue-50 dark:bg-blue-900/20",
              color: "text-blue-600",
            },
            {
              label: "Ahorro Mensual Potencial",
              value: `RD$ ${formatPesos(totalAhorro)}`,
              icon: DollarSign,
              bg: "bg-green-50 dark:bg-green-900/20",
              color: "text-green-600",
            },
            {
              label: "CO₂ Evitado/año",
              value: `${totalCO2.toFixed(1)} ton`,
              icon: Leaf,
              bg: "bg-emerald-50 dark:bg-emerald-900/20",
              color: "text-emerald-600",
            },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg} shrink-0`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold truncate">{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Viabilidad mini breakdown */}
        {simulations.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {(["excelente", "buena", "moderada", "limitada"] as const).map((v) => {
              const count = simulations.filter((s) => s.viabilidad === v).length;
              if (!count) return null;
              return (
                <div
                  key={v}
                  className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-foreground/20 transition-colors"
                  onClick={() => setFilterViab(filterViab === v ? "Todas" : v)}
                >
                  <Badge variant={viabilidadVariant[v]}>{viabilidadLabel[v]}</Badge>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              );
            })}
            {excelentes > 0 && (
              <p className="text-sm text-muted-foreground self-center ml-2">
                {Math.round((excelentes / simulations.length) * 100)}% con viabilidad excelente
              </p>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ubicación o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterViab} onChange={(e) => setFilterViab(e.target.value)} className="w-40">
            <option value="Todas">Todas las viabilidades</option>
            <option value="excelente">Excelente</option>
            <option value="buena">Buena</option>
            <option value="moderada">Moderada</option>
            <option value="limitada">Limitada</option>
          </Select>
          <Select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className="w-36">
            <option value="Todas">Todos los tipos</option>
            <option value="hogar">Hogar</option>
            <option value="negocio">Negocio</option>
          </Select>
          <Button variant="outline" onClick={fetchSimulations} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} simulación{filtered.length !== 1 ? "es" : ""}
          </span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-20 gap-3">
            <Sun className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              {simulations.length === 0
                ? "Aún no hay simulaciones registradas. Se mostrarán aquí cuando los usuarios usen el simulador del portal."
                : "No hay simulaciones que coincidan con los filtros."}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ubicación</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Factura</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sistema</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ahorro/mes</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">ROI</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">CO₂/año</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Viabilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((sim) => (
                    <tr key={sim.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(sim.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{sim.ubicacion}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={sim.categoria === "hogar" ? "info" : "purple"}>
                          {sim.categoria === "hogar" ? "Hogar" : "Negocio"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        RD$ {formatPesos(sim.facturaActual)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{sim.tamanoSistemaKwp} kWp</p>
                        <p className="text-xs text-muted-foreground">{sim.numeroPaneles} paneles</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        RD$ {formatPesos(sim.ahorroMensual)}
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          ({sim.porcentajeAhorro}%)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" style={{ color: edeColor }} />
                          <span className="font-medium">{sim.roiAnos} años</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sim.co2EvitadoAnual} ton
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={viabilidadVariant[sim.viabilidad] ?? "outline"}>
                          {viabilidadLabel[sim.viabilidad] ?? sim.viabilidad}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
