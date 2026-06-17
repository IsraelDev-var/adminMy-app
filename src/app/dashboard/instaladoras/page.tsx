"use client";

import { useState } from "react";
import { Search, CheckCircle, XCircle, Building2, Eye } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/src/components/layout/TopBar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Modal } from "@/src/components/ui/modal";
import { mockInstallers, mockRequests } from "@/src/data/mockData";
import { useAdminAuth } from "@/src/context/AdminAuthContext";
import type { InstallerCompany } from "@/src/types";

export default function InstaladorasPage() {
  const { session } = useAdminAuth();
  const ede = session?.ede;
  // Filter installers by those who have requests in this EDE
  const edeCompanyNames = new Set(
    ede
      ? mockRequests
          .filter((r) => r.distributorName === ede && r.companyName)
          .map((r) => r.companyName as string)
      : []
  );
  const edeInstallers = ede
    ? mockInstallers.filter((i) => edeCompanyNames.has(i.tradeName))
    : mockInstallers;
  const [installers, setInstallers] = useState<InstallerCompany[]>(edeInstallers);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InstallerCompany | null>(null);

  const filtered = installers.filter(
    (i) =>
      i.tradeName.toLowerCase().includes(search.toLowerCase()) ||
      i.rnc.includes(search) ||
      i.contactEmail.toLowerCase().includes(search.toLowerCase())
  );

  const toggleValidation = (id: number) => {
    setInstallers((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, isValidated: !i.isValidated } : i
      )
    );
    const installer = installers.find((i) => i.id === id);
    toast.success(
      installer?.isValidated
        ? "Validación revocada."
        : "Empresa instaladora validada exitosamente."
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const validated = installers.filter((i) => i.isValidated).length;
  const pending = installers.filter((i) => !i.isValidated).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Empresas Instaladoras"
        subtitle="Gestión y validación de instaladoras certificadas"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: installers.length, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Validadas", value: validated, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
            { label: "Pendientes", value: pending, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <Building2 className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, RNC o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} empresa{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inst) => (
            <div
              key={inst.id}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#135bec]/10 shrink-0">
                    <Building2 className="w-5 h-5 text-[#135bec]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{inst.tradeName}</p>
                    <p className="text-xs text-muted-foreground font-mono">RNC: {inst.rnc}</p>
                  </div>
                </div>
                <Badge variant={inst.isValidated ? "success" : "warning"}>
                  {inst.isValidated ? "Validada" : "Pendiente"}
                </Badge>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground truncate">{inst.contactEmail}</p>
                <p className="text-muted-foreground">{inst.contactPhone}</p>
                <p className="text-muted-foreground text-xs truncate">{inst.address}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Solicitudes</p>
                  <p className="font-bold text-[#135bec]">{inst.totalRequests}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Desde {formatDate(inst.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setSelected(inst)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Detalle
                </Button>
                <Button
                  variant={inst.isValidated ? "destructive" : "success"}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => toggleValidation(inst.id)}
                >
                  {inst.isValidated ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Revocar
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Validar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="Detalle de Empresa Instaladora"
          size="sm"
        >
          <div className="space-y-3">
            {[
              { label: "Nombre comercial", value: selected.tradeName },
              { label: "RNC", value: selected.rnc },
              { label: "Email de contacto", value: selected.contactEmail },
              { label: "Teléfono", value: selected.contactPhone },
              { label: "Dirección", value: selected.address },
              { label: "Total solicitudes", value: String(selected.totalRequests) },
              { label: "Estado", value: selected.isValidated ? "Validada" : "Pendiente" },
              { label: "Registro", value: formatDate(selected.createdAt) },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-sm gap-4">
                <span className="text-muted-foreground shrink-0">{f.label}</span>
                <span className="font-medium text-right">{f.value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
