"use client";

import { useState } from "react";
import { Bell, CheckCheck, Trash2, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/src/components/layout/TopBar";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";

type NotificationType = "success" | "warning" | "error" | "info";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Solicitud aprobada",
    message: "El expediente EXP-2025-004 de Grupo Eléctrico Caribe fue aprobado exitosamente.",
    type: "success",
    isRead: false,
    createdAt: "2025-03-08T09:30:00Z",
  },
  {
    id: 2,
    title: "Transformador en estado crítico",
    message: "El transformador TR-SDE-009 en Santo Domingo Este tiene disponibilidad del 8%.",
    type: "warning",
    isRead: false,
    createdAt: "2025-03-08T08:15:00Z",
  },
  {
    id: 3,
    title: "Nueva solicitud recibida",
    message: "EnerSol SRL ha enviado una nueva solicitud de Medición Neta (EXP-2025-006).",
    type: "info",
    isRead: false,
    createdAt: "2025-03-07T16:45:00Z",
  },
  {
    id: 4,
    title: "Solicitud rechazada",
    message: "El expediente EXP-2025-005 fue rechazado por capacidad insuficiente.",
    type: "error",
    isRead: true,
    createdAt: "2025-03-06T11:00:00Z",
  },
  {
    id: 5,
    title: "Nueva empresa instaladora registrada",
    message: "InverTech Solutions se ha registrado y requiere validación.",
    type: "info",
    isRead: true,
    createdAt: "2025-03-05T14:20:00Z",
  },
];

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
  error: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
};

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unread = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("Todas las notificaciones marcadas como leídas.");
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notificación eliminada.");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-DO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Notificaciones" subtitle="Centro de alertas y avisos del sistema" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#135bec]" />
            <span className="font-semibold">
              {unread > 0 ? (
                <>
                  <span className="text-[#135bec]">{unread}</span> sin leer
                </>
              ) : (
                "Todo al día"
              )}
            </span>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="w-4 h-4" />
              Marcar todo como leído
            </Button>
          )}
        </div>

        {/* List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No hay notificaciones
            </div>
          ) : (
            notifications.map((n) => {
              const cfg = typeConfig[n.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    n.isRead
                      ? "bg-card border-border"
                      : "bg-card border-[#135bec]/20 shadow-sm"
                  }`}
                  onClick={() => markRead(n.id)}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm">{n.title}</p>
                      {!n.isRead && (
                        <Badge variant="default" className="text-xs px-1.5 py-0">
                          Nueva
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
