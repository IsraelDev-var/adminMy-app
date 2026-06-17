"use client";

import { useState } from "react";
import { Search, UserCheck, UserX, Shield, Users, Eye } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/src/components/layout/TopBar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { Modal } from "@/src/components/ui/modal";
import { mockUsers, mockRequests } from "@/src/data/mockData";
import { useAdminAuth } from "@/src/context/AdminAuthContext";
import type { User } from "@/src/types";

const roleBadge: Record<string, { variant: "success" | "info" | "purple" | "warning" | "outline" }> = {
  Administrador: { variant: "purple" },
  Distribuidora: { variant: "info" },
  Instaladora: { variant: "warning" },
  Cliente: { variant: "outline" },
};

export default function UsuariosPage() {
  const { session } = useAdminAuth();
  const ede = session?.ede;
  // Show users who have requests in this EDE, excluding admins of other EDEs
  const edeUserIds = new Set(
    ede ? mockRequests.filter((r) => r.distributorName === ede).map((r) => r.userId) : []
  );
  const edeUsers = ede
    ? mockUsers.filter(
        (u) =>
          edeUserIds.has(u.id) ||
          u.companyName === ede ||
          (u.role !== "Distribuidora" && !edeUserIds.size)
      )
    : mockUsers;
  const [users, setUsers] = useState<User[]>(edeUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Todos");
  const [selected, setSelected] = useState<User | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchRole = filterRole === "Todos" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const toggleActive = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, isActive: !u.isActive } : u
      )
    );
    const user = users.find((u) => u.id === id);
    toast.success(
      user?.isActive ? "Usuario desactivado." : "Usuario activado."
    );
  };

  const toggleValidation = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, isValidated: !u.isValidated } : u
      )
    );
    const user = users.find((u) => u.id === id);
    toast.success(
      user?.isValidated
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

  const totalActive = users.filter((u) => u.isActive).length;
  const totalInstallers = users.filter((u) => u.role === "Instaladora").length;
  const pendingValidation = users.filter(
    (u) => u.role === "Instaladora" && !u.isValidated
  ).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Gestión de Usuarios"
        subtitle="Administra cuentas y valida empresas instaladoras"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total usuarios", value: users.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Activos", value: totalActive, icon: UserCheck, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
            { label: "Instaladoras", value: totalInstallers, icon: Shield, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Pendiente validación", value: pendingValidation, icon: UserX, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
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
              placeholder="Buscar por nombre, email o empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-44"
          >
            <option value="Todos">Todos los roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Distribuidora">Distribuidora</option>
            <option value="Instaladora">Instaladora</option>
            <option value="Cliente">Cliente</option>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Validación</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => {
                    const role = roleBadge[user.role];
                    return (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#135bec]/10 shrink-0">
                              <span className="text-xs font-bold text-[#135bec]">
                                {user.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={role.variant}>{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.companyName ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {user.role === "Instaladora" ? (
                            <Badge variant={user.isValidated ? "success" : "warning"}>
                              {user.isValidated ? "Validada" : "Pendiente"}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.isActive ? "success" : "destructive"}>
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver detalle"
                              onClick={() => setSelected(user)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {user.role === "Instaladora" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title={user.isValidated ? "Revocar validación" : "Validar empresa"}
                                className={
                                  user.isValidated
                                    ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                    : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                }
                                onClick={() => toggleValidation(user.id)}
                              >
                                {user.isValidated ? (
                                  <UserX className="w-3.5 h-3.5" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              title={user.isActive ? "Desactivar" : "Activar"}
                              className={
                                user.isActive
                                  ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              }
                              onClick={() => toggleActive(user.id)}
                            >
                              {user.isActive ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="Detalle del Usuario"
          size="sm"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#135bec]/10">
                <span className="text-lg font-bold text-[#135bec]">
                  {selected.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold">{selected.fullName}</p>
                <Badge variant={roleBadge[selected.role].variant}>{selected.role}</Badge>
              </div>
            </div>
            {[
              { label: "Email", value: selected.email },
              { label: "Teléfono", value: selected.phone },
              { label: "Empresa", value: selected.companyName ?? "N/A" },
              { label: "Estado", value: selected.isActive ? "Activo" : "Inactivo" },
              { label: "Registro", value: formatDate(selected.createdAt) },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-medium">{f.value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
