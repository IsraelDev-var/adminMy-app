"use client";

import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertTriangle,
  Building2,
  TrendingUp,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TopBar } from "@/src/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { mockStats, mockRequests, mockTransformers, mockInstallers, mockDistributors } from "@/src/data/mockData";
import { useAdminAuth } from "@/src/context/AdminAuthContext";

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "info" | "purple" | "outline" }> = {
  "Recibida": { label: "Recibida", variant: "info" },
  "En revisión": { label: "En revisión", variant: "warning" },
  "Observaciones": { label: "Observaciones", variant: "purple" },
  "En corrección": { label: "En corrección", variant: "warning" },
  "Aprobada": { label: "Aprobada", variant: "success" },
  "Rechazada": { label: "Rechazada", variant: "destructive" },
};

export default function DashboardPage() {
  const { session } = useAdminAuth();
  const ede = session?.ede;
  const edeColors: Record<string, string> = {
    EDESUR: "#135bec",
    EDENORTE: "#f59e0b",
    EDEESTE: "#22c55e",
  };
  const edeColor = ede ? (edeColors[ede] ?? "#135bec") : "#135bec";

  // Filter data by EDE
  const myRequests = ede ? mockRequests.filter((r) => r.distributorName === ede) : mockRequests;
  const myTransformers = ede ? mockTransformers.filter((t) => t.distributorName === ede) : mockTransformers;
  const myDistributor = mockDistributors.find((d) => d.name === ede);

  // Compute EDE-scoped KPIs
  const totalReqs = myRequests.length;
  const pendingReqs = myRequests.filter((r) => ["Recibida", "En revisión", "Observaciones", "En corrección"].includes(r.status)).length;
  const approvedReqs = myRequests.filter((r) => r.status === "Aprobada").length;
  const rejectedReqs = myRequests.filter((r) => r.status === "Rechazada").length;
  const criticalTrans = myTransformers.filter((t) => t.status === "Crítica" || t.status === "Saturada").length;
  const avgAvailability = myTransformers.length
    ? Math.round(myTransformers.reduce((sum, t) => sum + t.availabilityPercent, 0) / myTransformers.length)
    : 0;

  // Installer count related to EDE requests
  const installerIds = new Set(myRequests.map((r) => r.companyName).filter(Boolean));
  const activeInstallers = installerIds.size;

  const kpis = [
    {
      label: "Total Solicitudes",
      value: totalReqs,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      change: "+12% vs mes anterior",
      positive: true,
    },
    {
      label: "Pendientes",
      value: pendingReqs,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      change: "Requieren revisión",
      positive: null,
    },
    {
      label: "Aprobadas",
      value: approvedReqs,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
      change: totalReqs > 0 ? `${Math.round((approvedReqs / totalReqs) * 100)}% tasa de aprobación` : "—",
      positive: true,
    },
    {
      label: "Rechazadas",
      value: rejectedReqs,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
      change: totalReqs > 0 ? `${Math.round((rejectedReqs / totalReqs) * 100)}% tasa de rechazo` : "—",
      positive: false,
    },
    {
      label: "Transformadores",
      value: myTransformers.length,
      icon: Zap,
      color: "text-cyan-600",
      bg: "bg-cyan-50 dark:bg-cyan-900/20",
      change: `${avgAvailability}% disponibilidad promedio`,
      positive: avgAvailability > 50,
    },
    {
      label: "Instaladoras Activas",
      value: activeInstallers,
      icon: Building2,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      change: "Operando en su zona",
      positive: null,
    },
    {
      label: "Transformadores Críticos",
      value: criticalTrans,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
      change: "Requieren atención",
      positive: false,
    },
    {
      label: "Zonas de Servicio",
      value: myDistributor?.zones.length ?? 0,
      icon: MapPin,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      change: myDistributor?.region ?? "—",
      positive: null,
    },
  ];

  // Status pie data from EDE requests
  const statusPie = [
    { status: "Aprobadas", count: approvedReqs, color: "#22c55e" },
    { status: "Pendientes", count: pendingReqs, color: "#f59e0b" },
    { status: "Rechazadas", count: rejectedReqs, color: "#ef4444" },
  ].filter((d) => d.count > 0);

  const recentRequests = myRequests.slice(0, 5);

  // Installer leaderboard for this EDE
  const installerMap: Record<string, number> = {};
  for (const req of myRequests) {
    if (req.companyName) {
      installerMap[req.companyName] = (installerMap[req.companyName] ?? 0) + 1;
    }
  }
  const topInstallers = Object.entries(installerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, requests]) => ({ name, requests }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Dashboard"
        subtitle={`${ede ?? "Panel"} · Resumen de tu red · Marzo 2025`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* EDE Identity Banner */}
        {myDistributor && (
          <div
            className="flex items-center gap-4 rounded-xl p-4 border"
            style={{ backgroundColor: `${edeColor}0d`, borderColor: `${edeColor}33` }}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
              style={{ backgroundColor: `${edeColor}22` }}
            >
              <Building2 className="w-6 h-6" style={{ color: edeColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base" style={{ color: edeColor }}>{myDistributor.fullName}</p>
              <p className="text-sm text-muted-foreground">{myDistributor.region} · {myDistributor.zones.length} zonas de servicio</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold" style={{ color: edeColor }}>{totalReqs}</p>
              <p className="text-xs text-muted-foreground">solicitudes totales</p>
            </div>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="py-4 gap-3">
                <CardContent className="px-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        {kpi.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {kpi.value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${kpi.bg}`}>
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {kpi.positive !== null && (
                      <ArrowUpRight
                        className={`w-3 h-3 ${kpi.positive ? "text-green-500" : "text-red-500 rotate-180"}`}
                      />
                    )}
                    <p className="text-xs text-muted-foreground">{kpi.change}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <Card className="lg:col-span-2 gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: edeColor }} />
                <CardTitle className="text-base">Solicitudes por Mes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mockStats.monthlyRequestsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="total" name="Total" fill={edeColor} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aprobadas" name="Aprobadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rechazadas" name="Rechazadas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-base">Estados de Solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
              {statusPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="status"
                    >
                      {statusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
                  Sin datos de solicitudes
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <Card className="lg:col-span-2 gap-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Solicitudes Recientes</CardTitle>
                <a href="/dashboard/solicitudes" className="text-xs hover:underline" style={{ color: edeColor }}>
                  Ver todas →
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay solicitudes para esta EDE.</p>
              ) : (
                <div className="space-y-3">
                  {recentRequests.map((req) => {
                    const s = statusBadge[req.status];
                    return (
                      <div
                        key={req.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{req.expedientNumber}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {req.companyName ?? req.userName} · {req.serviceZone}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {req.requestType === "Medición Neta" ? "MN" : "CE"}
                          </span>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Installers */}
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-base">Top Instaladoras</CardTitle>
            </CardHeader>
            <CardContent>
              {topInstallers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin datos.</p>
              ) : (
                <div className="space-y-3">
                  {topInstallers.map((inst, i) => (
                    <div key={inst.name} className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 text-white"
                        style={{ backgroundColor: edeColor }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inst.name}</p>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(inst.requests / (topInstallers[0]?.requests ?? 1)) * 100}%`,
                              backgroundColor: edeColor,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground shrink-0">
                        {inst.requests}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
