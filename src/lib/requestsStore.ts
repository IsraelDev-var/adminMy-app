/**
 * Singleton in-memory store for connection requests.
 * Lives in Node.js server memory — initialized from mockData on first import.
 * Shared across all API route handlers in this Next.js server process.
 */
import { mockRequests, mockTransformers } from "@/src/data/mockData";
import type { ConnectionRequest, DistributorName } from "@/src/types";

// Module-level variables (singleton per Node process)
let _requests: ConnectionRequest[] = [...mockRequests];
let _nextId = Math.max(...mockRequests.map((r) => r.id)) + 1;

export const requestsStore = {
  getAll(): ConnectionRequest[] {
    return _requests;
  },

  getByEde(ede: DistributorName): ConnectionRequest[] {
    return _requests.filter((r) => r.distributorName === ede);
  },

  getById(id: number): ConnectionRequest | undefined {
    return _requests.find((r) => r.id === id);
  },

  add(req: ConnectionRequest): void {
    _requests.push(req);
  },

  update(id: number, updates: Partial<ConnectionRequest>): ConnectionRequest | null {
    const idx = _requests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    _requests[idx] = { ..._requests[idx], ...updates };
    return _requests[idx];
  },

  nextId(): number {
    return _nextId++;
  },

  /** Build a ConnectionRequest from my-app's SolicitudData form payload */
  buildFromFormData(formData: Record<string, Record<string, unknown>>): ConnectionRequest {
    const step2 = (formData.step2 ?? {}) as Record<string, string>;
    const step4 = (formData.step4 ?? {}) as Record<string, string>;
    const step6 = (formData.step6 ?? {}) as { generators?: Array<{ capacidadKW?: number; cantidad?: number }> };
    const step7 = (formData.step7 ?? {}) as { files?: unknown[] };

    const distributorName = step4.empresaDistribuidora as DistributorName;
    const totalKw = (step6.generators ?? []).reduce(
      (sum, g) => sum + (g.capacidadKW ?? 0) * (g.cantidad ?? 1),
      0
    );

    // Auto-assign first Disponible transformer of this EDE, else any
    const transformer =
      mockTransformers.find((t) => t.distributorName === distributorName && t.status === "Disponible") ??
      mockTransformers.find((t) => t.distributorName === distributorName);

    const now = new Date().toISOString();
    const id = this.nextId();

    return {
      id,
      expedientNumber: `EXP-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`,
      userId: "ext-user",
      userName: `${step2.nombre ?? ""} ${step2.apellidos ?? ""}`.trim() || "Usuario externo",
      userEmail: step2.email ?? "",
      transformerId: transformer?.id ?? 0,
      transformerCode: transformer?.code ?? "TBD",
      serviceZone: step4.municipio ?? step4.provincia ?? "Sin zona",
      distributorName,
      requestType: "Medición Neta",
      status: "Recibida",
      requiredCapacityKw: totalKw,
      createdAt: now,
      updatedAt: now,
      documentsCount: (step7.files ?? []).length,
    };
  },
};
