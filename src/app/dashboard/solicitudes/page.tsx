"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Download,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TopBar } from "@/src/components/layout/TopBar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { Modal } from "@/src/components/ui/modal";
import { Textarea } from "@/src/components/ui/textarea";
import { useAdminAuth } from "@/src/context/AdminAuthContext";
import type { ConnectionRequest, RequestStatus } from "@/src/types";

const statusBadge: Record<RequestStatus, { variant: "success" | "warning" | "destructive" | "info" | "purple" | "outline" }> = {
  "Recibida": { variant: "info" },
  "En revisión": { variant: "warning" },
  "Observaciones": { variant: "purple" },
  "En corrección": { variant: "warning" },
  "Aprobada": { variant: "success" },
  "Rechazada": { variant: "destructive" },
};

const statusFlow: Record<RequestStatus, RequestStatus[]> = {
  "Recibida": ["En revisión"],
  "En revisión": ["Observaciones", "Aprobada", "Rechazada"],
  "Observaciones": ["En corrección", "Rechazada"],
  "En corrección": ["En revisión", "Aprobada", "Rechazada"],
  "Aprobada": [],
  "Rechazada": [],
};

type ActionModal = "approve" | "reject" | "observe" | "review";

// ─── PDF Generator ────────────────────────────────────────────────────────────

function downloadResumenPDF(req: ConnectionRequest) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header strip
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN DE SOLICITUD", pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Expediente: ${req.expedientNumber}  |  ${req.distributorName}`, pageWidth / 2, 21, { align: "center" });
  doc.setTextColor(0);

  // Status pill
  const statusColors: Record<RequestStatus, [number, number, number]> = {
    Recibida: [59, 130, 246],
    "En revisión": [245, 158, 11],
    Observaciones: [139, 92, 246],
    "En corrección": [245, 158, 11],
    Aprobada: [34, 197, 94],
    Rechazada: [239, 68, 68],
  };
  const [r, g, b] = statusColors[req.status];
  doc.setFillColor(r, g, b);
  doc.roundedRect(14, 34, 50, 8, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(req.status.toUpperCase(), 39, 39.5, { align: "center" });
  doc.setTextColor(0);

  // Data table
  autoTable(doc, {
    startY: 48,
    head: [["Campo", "Valor"]],
    body: [
      ["Número de Expediente", req.expedientNumber],
      ["Solicitante", req.companyName ?? req.userName],
      ["Correo electrónico", req.userEmail],
      ["Distribuidora", req.distributorName],
      ["Zona de servicio", req.serviceZone],
      ["Transformador asignado", req.transformerCode],
      ["Tipo de solicitud", req.requestType],
      ["Capacidad requerida", `${req.requiredCapacityKw} kW`],
      ["Documentos adjuntos", String(req.documentsCount)],
      ["Fecha de creación", new Date(req.createdAt).toLocaleString("es-DO")],
      ["Última actualización", new Date(req.updatedAt).toLocaleString("es-DO")],
    ],
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
  });

  // Observation box
  if (req.lastObservation) {
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, finalY, pageWidth - 28, 22, 2, 2, "FD");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 64, 14);
    doc.text("ÚLTIMA OBSERVACIÓN", 18, finalY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 53, 15);
    const split = doc.splitTextToSize(req.lastObservation, pageWidth - 36);
    doc.text(split, 18, finalY + 13);
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generado: ${new Date().toLocaleString("es-DO")}  |  Pág. ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 8,
      { align: "center" }
    );
  }

  doc.save(`resumen-${req.expedientNumber}.pdf`);
  toast.success(`Resumen de ${req.expedientNumber} descargado.`);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SolicitudesPage() {
  const { session } = useAdminAuth();
  const ede = session?.ede;

  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todas");
  const [filterType, setFilterType] = useState("Todos");
  const [selected, setSelected] = useState<ConnectionRequest | null>(null);
  const [actionModal, setActionModal] = useState<ActionModal | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    const url = ede ? `/api/solicitudes?ede=${ede}` : "/api/solicitudes";
    const res = await fetch(url);
    if (res.ok) setRequests(await res.json());
  }, [ede]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.expedientNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      (r.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      r.transformerCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Todas" || r.status === filterStatus;
    const matchType = filterType === "Todos" || r.requestType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const handleAction = async () => {
    if (!selected) return;
    if ((actionModal === "reject" || actionModal === "observe") && !comment.trim()) {
      toast.error("Debes agregar un comentario para esta acción.");
      return;
    }
    setLoading(true);

    const newStatus: RequestStatus =
      actionModal === "approve" ? "Aprobada"
      : actionModal === "reject"  ? "Rechazada"
      : actionModal === "observe" ? "Observaciones"
      : "En revisión"; // "review"

    await fetch(`/api/solicitudes/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, lastObservation: comment || undefined }),
    });

    await fetchRequests();

    const messages: Record<ActionModal, string> = {
      approve: "Solicitud aprobada exitosamente.",
      reject: "Solicitud rechazada.",
      observe: "Observaciones enviadas al solicitante.",
      review: "Solicitud puesta en revisión.",
    };
    toast.success(messages[actionModal!]);
    setActionModal(null);
    setSelected(null);
    setComment("");
    setLoading(false);
  };

  const openAction = (req: ConnectionRequest, action: ActionModal) => {
    setSelected(req);
    setComment("");
    setActionModal(action);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Gestión de Solicitudes"
        subtitle="Revisa, aprueba o rechaza solicitudes de conexión y medición neta"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por expediente, empresa, transformador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-44">
              <option value="Todas">Todos los estados</option>
              <option value="Recibida">Recibida</option>
              <option value="En revisión">En revisión</option>
              <option value="Observaciones">Observaciones</option>
              <option value="En corrección">En corrección</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
            </Select>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-44">
              <option value="Todos">Todos los tipos</option>
              <option value="Conexión Estándar">Conexión Estándar</option>
              <option value="Medición Neta">Medición Neta</option>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} solicitud{filtered.length !== 1 ? "es" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expediente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Solicitante</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Zona</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Docs</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      No se encontraron solicitudes
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => {
                    const s = statusBadge[req.status];
                    const nextStates = statusFlow[req.status];
                    const canReview  = nextStates.includes("En revisión");
                    const canApprove = nextStates.includes("Aprobada");
                    const canReject  = nextStates.includes("Rechazada");
                    const canObserve = nextStates.includes("Observaciones");

                    return (
                      <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="font-mono text-xs font-medium">{req.expedientNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium truncate max-w-36">{req.companyName ?? req.userName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-36">{req.userEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="truncate max-w-32 text-muted-foreground">{req.serviceZone}</p>
                          <p className="text-xs font-mono text-muted-foreground">{req.transformerCode}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={req.requestType === "Medición Neta" ? "purple" : "info"}>
                            {req.requestType === "Medición Neta" ? "Med. Neta" : "Conexión"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={s.variant}>{req.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium">{req.documentsCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title="Ver detalle" onClick={() => setSelected(req)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Descargar resumen PDF" onClick={() => downloadResumenPDF(req)}>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            {canReview && (
                              <Button
                                variant="ghost" size="icon" title="Iniciar revisión"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => openAction(req, "review")}
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {canApprove && (
                              <Button
                                variant="ghost" size="icon" title="Aprobar"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={() => openAction(req, "approve")}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {canObserve && (
                              <Button
                                variant="ghost" size="icon" title="Enviar observaciones"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                onClick={() => openAction(req, "observe")}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {canReject && (
                              <Button
                                variant="ghost" size="icon" title="Rechazar"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => openAction(req, "reject")}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
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
      {selected && !actionModal && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`Expediente ${selected.expedientNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Solicitante</p>
                <p className="font-medium">{selected.companyName ?? selected.userName}</p>
                <p className="text-sm text-muted-foreground">{selected.userEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estado actual</p>
                <Badge variant={statusBadge[selected.status].variant} className="text-sm px-3 py-1">
                  {selected.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tipo de solicitud</p>
                <p className="font-medium">{selected.requestType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Capacidad requerida</p>
                <p className="font-medium">{selected.requiredCapacityKw} kW</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Transformador</p>
                <p className="font-mono text-sm font-medium">{selected.transformerCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Zona de servicio</p>
                <p className="font-medium">{selected.serviceZone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Documentos adjuntos</p>
                <p className="font-medium">{selected.documentsCount} archivo(s)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha de creación</p>
                <p className="font-medium">{formatDate(selected.createdAt)}</p>
              </div>
            </div>

            {selected.lastObservation && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Última observación</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{selected.lastObservation}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="gap-2" onClick={() => downloadResumenPDF(selected)}>
                <Download className="w-4 h-4" />
                Descargar PDF
              </Button>
              {statusFlow[selected.status].includes("En revisión") && (
                <Button variant="default" className="gap-2" onClick={() => setActionModal("review")}>
                  <PlayCircle className="w-4 h-4" />
                  Iniciar revisión
                </Button>
              )}
              {statusFlow[selected.status].includes("Aprobada") && (
                <Button variant="success" className="gap-2" onClick={() => setActionModal("approve")}>
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </Button>
              )}
              {statusFlow[selected.status].includes("Observaciones") && (
                <Button variant="warning" className="gap-2" onClick={() => setActionModal("observe")}>
                  <MessageSquare className="w-4 h-4" />
                  Observaciones
                </Button>
              )}
              {statusFlow[selected.status].includes("Rechazada") && (
                <Button variant="destructive" className="gap-2" onClick={() => setActionModal("reject")}>
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Action Modal */}
      {actionModal && selected && (
        <Modal
          isOpen={!!actionModal}
          onClose={() => { setActionModal(null); setComment(""); }}
          title={
            actionModal === "approve" ? "Aprobar solicitud"
            : actionModal === "reject" ? "Rechazar solicitud"
            : actionModal === "review" ? "Iniciar revisión"
            : "Enviar observaciones"
          }
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Expediente:{" "}
              <span className="font-mono font-medium text-foreground">{selected.expedientNumber}</span>
            </p>

            {actionModal === "approve" && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Al aprobar, se notificará al solicitante y se actualizará el estado a Aprobada.
                </p>
              </div>
            )}
            {actionModal === "review" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  La solicitud pasará a "En revisión". Podrás aprobarla, rechazarla o enviar observaciones.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Comentario{(actionModal === "reject" || actionModal === "observe") ? " (obligatorio)" : " (opcional)"}
              </label>
              <Textarea
                placeholder={
                  actionModal === "observe"
                    ? "Describe las observaciones técnicas o documentales..."
                    : actionModal === "reject"
                    ? "Justifica el motivo del rechazo..."
                    : actionModal === "review"
                    ? "Nota de inicio de revisión (opcional)..."
                    : "Comentario adicional (opcional)..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={() => { setActionModal(null); setComment(""); }}>
                Cancelar
              </Button>
              <Button
                variant={
                  actionModal === "approve" ? "success"
                  : actionModal === "reject" ? "destructive"
                  : actionModal === "observe" ? "warning"
                  : "default"
                }
                onClick={handleAction}
                disabled={loading}
              >
                {loading ? "Procesando..."
                  : actionModal === "approve" ? "Confirmar aprobación"
                  : actionModal === "reject" ? "Confirmar rechazo"
                  : actionModal === "review" ? "Iniciar revisión"
                  : "Enviar observaciones"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
