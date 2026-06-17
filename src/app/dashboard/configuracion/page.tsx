"use client";

import { useState } from "react";
import { Save, Shield, Bell, Palette, Globe } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/src/components/layout/TopBar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function ConfiguracionPage() {
  const [saving, setSaving] = useState(false);

  const [thresholds, setThresholds] = useState({
    disponible: 70,
    condicionada: 30,
    critica: 15,
  });

  const [notifications, setNotifications] = useState({
    emailOnNewRequest: true,
    emailOnStatusChange: true,
    emailOnCriticalTransformer: true,
    internalOnApproval: true,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Configuración guardada exitosamente.");
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Configuración" subtitle="Parámetros del sistema y preferencias" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Thresholds */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#135bec]" />
              <CardTitle className="text-base">Umbrales de Disponibilidad de Transformadores</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Define los porcentajes de disponibilidad que determinan el estado del transformador.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                  Disponible (desde %)
                </label>
                <Input
                  type="number"
                  value={thresholds.disponible}
                  onChange={(e) =>
                    setThresholds((p) => ({ ...p, disponible: Number(e.target.value) }))
                  }
                  min={0}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">
                  Transformadores con disponibilidad ≥ {thresholds.disponible}% son "Disponibles"
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  Condicionada (desde %)
                </label>
                <Input
                  type="number"
                  value={thresholds.condicionada}
                  onChange={(e) =>
                    setThresholds((p) => ({ ...p, condicionada: Number(e.target.value) }))
                  }
                  min={0}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">
                  Entre {thresholds.condicionada}% y {thresholds.disponible - 1}% es "Condicionada"
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  Crítica (desde %)
                </label>
                <Input
                  type="number"
                  value={thresholds.critica}
                  onChange={(e) =>
                    setThresholds((p) => ({ ...p, critica: Number(e.target.value) }))
                  }
                  min={0}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">
                  Entre {thresholds.critica}% y {thresholds.condicionada - 1}% es "Crítica". Por debajo es "Saturada"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#135bec]" />
              <CardTitle className="text-base">Notificaciones Automáticas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  key: "emailOnNewRequest",
                  label: "Email al recibir nueva solicitud",
                  desc: "Notificar al administrador cuando un usuario envía una nueva solicitud",
                },
                {
                  key: "emailOnStatusChange",
                  label: "Email al cambiar estado de solicitud",
                  desc: "Notificar al solicitante cuando su expediente cambia de estado",
                },
                {
                  key: "emailOnCriticalTransformer",
                  label: "Alerta de transformador crítico",
                  desc: "Notificar cuando un transformador cae por debajo del umbral crítico",
                },
                {
                  key: "internalOnApproval",
                  label: "Notificación interna al aprobar",
                  desc: "Mostrar notificación interna al usuario cuando su solicitud es aprobada",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications((p) => ({
                        ...p,
                        [item.key]: !p[item.key as keyof typeof p],
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                      notifications[item.key as keyof typeof notifications]
                        ? "bg-[#135bec]"
                        : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        notifications[item.key as keyof typeof notifications]
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System info */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#135bec]" />
              <CardTitle className="text-base">Información del Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { label: "Versión", value: "1.1.0" },
                { label: "Entorno", value: "Producción" },
                { label: "Framework", value: "Next.js 16" },
                { label: "Backend", value: "ASP.NET Core 8" },
                { label: "Base de datos", value: "PostgreSQL + PostGIS" },
                { label: "Almacenamiento", value: "Azure Blob Storage" },
              ].map((f) => (
                <div key={f.label} className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
                  <p className="font-medium">{f.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Zap({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
