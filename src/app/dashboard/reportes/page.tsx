"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, FileSpreadsheet, FileText, TrendingUp, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/src/components/layout/TopBar";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { mockStats } from "@/src/data/mockData";

const monthlyTrend = [
  { mes: "Oct", solicitudes: 28, usuarios: 95, instaladoras: 32 },
  { mes: "Nov", solicitudes: 35, usuarios: 112, instaladoras: 34 },
  { mes: "Dic", solicitudes: 22, usuarios: 98, instaladoras: 34 },
  { mes: "Ene", solicitudes: 40, usuarios: 145, instaladoras: 36 },
  { mes: "Feb", solicitudes: 55, usuarios: 180, instaladoras: 37 },
  { mes: "Mar", solicitudes: 68, usuarios: 210, instaladoras: 38 },
];

const requestTypeData = [
  { tipo: "Conexión Estándar", count: 142, color: "#135bec" },
  { tipo: "Medición Neta", count: 106, color: "#8b5cf6" },
];

export default function ReportesPage() {
  const [period, setPeriod] = useState("6m");

  const handleExportPDF = () => {
    toast.success("Generando reporte PDF... Se descargará en breve.");
  };

  const handleExportExcel = () => {
    toast.success("Generando reporte Excel... Se descargará en breve.");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Reportes y Estadísticas"
        subtitle="Análisis de solicitudes, usuarios y red eléctrica"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Período:</label>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-44"
            >
              <option value="1m">Último mes</option>
              <option value="3m">Últimos 3 meses</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="1y">Último año</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF} className="gap-2">
              <FileText className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total solicitudes", value: mockStats.totalRequests, sub: "en el período" },
            { label: "Tasa de aprobación", value: `${Math.round((mockStats.approvedRequests / mockStats.totalRequests) * 100)}%`, sub: `${mockStats.approvedRequests} aprobadas` },
            { label: "Tiempo prom. revisión", value: "4.2 días", sub: "por solicitud" },
            { label: "Nuevos usuarios", value: "+210", sub: "en el período" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line trend */}
          <Card className="lg:col-span-2 gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#135bec]" />
                <CardTitle className="text-base">Tendencia mensual</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="solicitudes"
                    name="Solicitudes"
                    stroke="#135bec"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="usuarios"
                    name="Nuevos usuarios"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="instaladoras"
                    name="Instaladoras"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie by type */}
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-base">Tipo de Solicitud</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={requestTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="count"
                    nameKey="tipo"
                    label={({ tipo, percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {requestTypeData.map((entry, i) => (
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
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By zone */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#135bec]" />
                <CardTitle className="text-base">Solicitudes por Zona</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={mockStats.requestsByZone}
                  layout="vertical"
                  margin={{ left: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="zone"
                    tick={{ fontSize: 10 }}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" name="Solicitudes" fill="#135bec" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Installers table */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#135bec]" />
                <CardTitle className="text-base">Ranking de Instaladoras</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockStats.topInstallers.map((inst, i) => {
                  const pct = (inst.requests / mockStats.topInstallers[0].requests) * 100;
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div key={inst.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{medals[i] ?? `#${i + 1}`}</span>
                          <span className="font-medium truncate max-w-40">{inst.name}</span>
                        </div>
                        <span className="font-bold text-[#135bec] shrink-0">
                          {inst.requests} sol.
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#135bec] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly table */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resumen Mensual Detallado</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
                <Download className="w-3.5 h-3.5" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Mes</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Aprobadas</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Rechazadas</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Tasa aprobación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockStats.monthlyRequestsData.map((row) => (
                    <tr key={row.month} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 font-medium">{row.month}</td>
                      <td className="py-2 px-3 text-center">{row.total}</td>
                      <td className="py-2 px-3 text-center text-green-600 font-medium">{row.aprobadas}</td>
                      <td className="py-2 px-3 text-center text-red-600 font-medium">{row.rechazadas}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-medium">
                          {Math.round((row.aprobadas / row.total) * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
