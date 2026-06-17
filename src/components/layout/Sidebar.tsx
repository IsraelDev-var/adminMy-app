"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Bell,
  Map,
  Sun,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminAuth } from "@/src/context/AdminAuthContext";
import { useRouter } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Solicitudes",
    href: "/dashboard/solicitudes",
    icon: FileText,
  },
  {
    label: "Usuarios",
    href: "/dashboard/usuarios",
    icon: Users,
  },
  {
    label: "Instaladoras",
    href: "/dashboard/instaladoras",
    icon: Building2,
  },
  {
    label: "Transformadores",
    href: "/dashboard/transformadores",
    icon: Zap,
  },
  {
    label: "Mapa",
    href: "/dashboard/mapa",
    icon: Map,
  },
  {
    label: "Simulaciones",
    href: "/dashboard/simulaciones",
    icon: Sun,
  },
  {
    label: "Reportes",
    href: "/dashboard/reportes",
    icon: BarChart3,
  },
  {
    label: "Notificaciones",
    href: "/dashboard/notificaciones",
    icon: Bell,
  },
  {
    label: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);

  const edeColors: Record<string, string> = {
    EDESUR: "#135bec",
    EDENORTE: "#f59e0b",
    EDEESTE: "#22c55e",
  };
  const edeColor = session ? (edeColors[session.ede] ?? "#135bec") : "#135bec";

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente");
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: edeColor }}>
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-foreground leading-tight truncate">Proyecto Z</p>
            <p className="text-xs font-medium truncate" style={{ color: edeColor }}>
              {session?.ede ?? "Panel Admin"}
            </p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border shadow-sm hover:bg-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#135bec] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-2 py-4 border-t border-border space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: `${edeColor}1a` }}>
              <span className="text-xs font-bold" style={{ color: edeColor }}>
                {session?.adminName?.charAt(0).toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{session?.adminName ?? "Administrador"}</p>
              <p className="text-xs text-muted-foreground truncate">{session?.adminEmail ?? ""}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-all duration-200",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
