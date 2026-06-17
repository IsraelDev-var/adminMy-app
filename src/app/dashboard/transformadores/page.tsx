"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Zap, AlertTriangle, MapPin, Eye, RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/src/components/layout/TopBar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { Modal } from "@/src/components/ui/modal";
import { useAdminAuth } from "@/src/context/AdminAuthContext";
import type { Transformer, TransformerStatus } from "@/src/types";

const statusBadge: Record<
  TransformerStatus,
  { variant: "success" | "warning" | "destructive" | "info"; dot: string }
> = {
  Disponible: { variant: "success", dot: "bg-green-500" },
  Condicionada: { variant: "warning", dot: "bg-amber-500" },
  Crítica: { variant: "destructive", dot: "bg-red-500" },
  Saturada: { variant: "destructive", dot: "bg-red-700" },
};

export default function TransformadoresPage() {
  const { session } = useAdminAuth();
  const ede = session?.ede;

  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selected, setSelected] = useState<Transformer | null>(null);
  const [editing, setEditing] = useState<Transformer | null>(null);
  const [editStatus, setEditStatus] = useState<TransformerStatus>("Disponible");
  const [editCapacity, setEditCapacity] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTransformers = useCallback(async () => {
    const url = ede ? `/api/transformers?ede=${ede}` : "/api/transformers";
    const res = await fetch(url);
    if (res.ok) setTransformers(await res.json());
  }, [ede]);

  useEffect(() => { fetchTransformers(); }, [fetchTransformers]);

  const filtered = transformers.filter((t) => {
    const matchSearch =
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.serviceZone.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Todos" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleRefresh = async () => {
    await fetchTransformers();
    toast.success("Datos actualizados desde la base de datos.");
  };

  const openEdit = (t: Transformer) => {
    setEditing(t);
    setEditStatus(t.status);
    setEditCapacity(String(t.availableCapacityKva));
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const avail = Number(editCapacity);
    if (isNaN(avail) || avail < 0 || avail > editing.totalCapacityKva) {
      toast.error(`La capacidad disponible debe estar entre 0 y ${editing.totalCapacityKva} kVA`);
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/transformers/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus, availableCapacityKva: avail }),
    });
    if (res.ok) {
      await fetchTransformers();
      toast.success(`Transformador ${editing.code} actualizado correctamente.`);
      setEditing(null);
    } else {
      toast.error("Error al actualizar el transformador.");
    }
    setSaving(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-DO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const byStatus = (s: TransformerStatus) =>
    transformers.filter((t) => t.status === s).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Red de Transformadores"
        subtitle="Estado en tiempo real de la red de distribución eléctrica"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["Disponible", "Condicionada", "Crítica", "Saturada"] as TransformerStatus[]).map((s) => {
            const sb = statusBadge[s];
            return (
              <div
                key={s}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-foreground/20 transition-colors"
                onClick={() => setFilterStatus(filterStatus === s ? "Todos" : s)}
              >
                <span className={`w-3 h-3 rounded-full shrink-0 ${sb.dot}`} />
                <div>
                  <p className="text-xl font-bold">{byStatus(s)}</p>
                  <p className="text-xs text-muted-foreground">{s}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o zona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-44">
            <option value="Todos">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Condicionada">Condicionada</option>
            <option value="Crítica">Crítica</option>
            <option value="Saturada">Saturada</option>
          </Select>
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} transformador{filtered.length !== 1 ? "es" : ""}
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const s = statusBadge[t.status];
            const percent = t.availabilityPercent;
            const barColor =
              percent >= 70 ? "bg-green-500" : percent >= 30 ? "bg-amber-500" : "bg-red-500";

            return (
              <div key={t.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${t.status === "Disponible" ? "bg-green-50 dark:bg-green-900/20" : t.status === "Condicionada" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                      {t.status === "Crítica" || t.status === "Saturada" ? (
                        <AlertTriangle className={`w-5 h-5 ${t.status === "Saturada" ? "text-red-700" : "text-red-500"}`} />
                      ) : (
                        <Zap className={`w-5 h-5 ${t.status === "Disponible" ? "text-green-600" : "text-amber-600"}`} />
                      )}
                    </div>
                    <div>
                      <p className="font-mono font-semibold text-sm">{t.code}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{t.serviceZone}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={s.variant}>{t.status}</Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Capacidad disponible</span>
                    <span className="font-semibold">{percent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.availableCapacityKva} kVA disponible</span>
                    <span>{t.totalCapacityKva} kVA total</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Última actualización</p>
                    <p className="text-xs font-medium">{formatDate(t.lastUpdated)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSelected(t)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={() => openEdit(t)}>
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No se encontraron transformadores con los filtros actuales.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && !editing && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Transformador ${selected.code}`} size="sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Badge variant={statusBadge[selected.status].variant}>{selected.status}</Badge>
              <span className="text-sm text-muted-foreground">Disponibilidad: {selected.availabilityPercent}%</span>
            </div>
            {[
              { label: "Código", value: selected.code },
              { label: "Distribuidora", value: selected.distributorName },
              { label: "Zona", value: selected.serviceZone },
              { label: "Capacidad total", value: `${selected.totalCapacityKva} kVA` },
              { label: "Capacidad disponible", value: `${selected.availableCapacityKva} kVA` },
              { label: "Coordenadas", value: `${selected.lat}, ${selected.lng}` },
              { label: "Última actualización", value: formatDate(selected.lastUpdated) },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-medium">{f.value}</span>
              </div>
            ))}
            <div className="pt-2">
              <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => { setSelected(null); openEdit(selected); }}>
                <Pencil className="w-3.5 h-3.5" />
                Editar estado
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Actualizar ${editing.code}`} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Zona: <span className="font-medium text-foreground">{editing.serviceZone}</span>
              {" · "}Capacidad total: <span className="font-medium text-foreground">{editing.totalCapacityKva} kVA</span>
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TransformerStatus)}
                className="w-full"
              >
                <option value="Disponible">Disponible</option>
                <option value="Condicionada">Condicionada</option>
                <option value="Crítica">Crítica</option>
                <option value="Saturada">Saturada</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Capacidad disponible (kVA)
                <span className="text-xs text-muted-foreground font-normal ml-2">máx. {editing.totalCapacityKva}</span>
              </label>
              <Input
                type="number"
                min={0}
                max={editing.totalCapacityKva}
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
                placeholder={`0 – ${editing.totalCapacityKva}`}
              />
              {editCapacity !== "" && (
                <p className="text-xs text-muted-foreground">
                  Disponibilidad: {Math.round((Number(editCapacity) / editing.totalCapacityKva) * 100)}%
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button variant="default" onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
