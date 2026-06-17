import { getPool } from "./db";
import type { ConnectionRequest, DistributorName } from "@/src/types";
import type { Transformer } from "@/src/types";

function rowToRequest(row: Record<string, unknown>): ConnectionRequest {
  return {
    id: row.id as number,
    expedientNumber: row.expedient_number as string,
    userId: row.user_id as string,
    userName: row.user_name as string,
    userEmail: row.user_email as string,
    companyName: row.company_name as string | undefined,
    transformerId: row.transformer_id as number,
    transformerCode: row.transformer_code as string,
    serviceZone: row.service_zone as string,
    distributorName: row.distributor_name as DistributorName,
    requestType: row.request_type as ConnectionRequest["requestType"],
    status: row.status as ConnectionRequest["status"],
    requiredCapacityKw: parseFloat(String(row.required_capacity_kw)),
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
    updatedAt: row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at),
    documentsCount: row.documents_count as number,
    lastObservation: row.last_observation as string | undefined,
  };
}

export const requestsStore = {
  async getAll(): Promise<ConnectionRequest[]> {
    const { rows } = await getPool().query(
      "SELECT * FROM connection_requests ORDER BY id"
    );
    return rows.map(rowToRequest);
  },

  async getByEde(ede: DistributorName): Promise<ConnectionRequest[]> {
    const { rows } = await getPool().query(
      "SELECT * FROM connection_requests WHERE distributor_name = $1 ORDER BY id",
      [ede]
    );
    return rows.map(rowToRequest);
  },

  async getById(id: number): Promise<ConnectionRequest | undefined> {
    const { rows } = await getPool().query(
      "SELECT * FROM connection_requests WHERE id = $1",
      [id]
    );
    return rows[0] ? rowToRequest(rows[0]) : undefined;
  },

  async add(req: ConnectionRequest): Promise<void> {
    await getPool().query(
      `INSERT INTO connection_requests
        (id, expedient_number, user_id, user_name, user_email, company_name,
         transformer_id, transformer_code, service_zone, distributor_name,
         request_type, status, required_capacity_kw, created_at, updated_at,
         documents_count, last_observation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        req.id, req.expedientNumber, req.userId, req.userName, req.userEmail,
        req.companyName ?? null, req.transformerId, req.transformerCode,
        req.serviceZone, req.distributorName, req.requestType, req.status,
        req.requiredCapacityKw, req.createdAt, req.updatedAt,
        req.documentsCount, req.lastObservation ?? null,
      ]
    );
  },

  async update(
    id: number,
    updates: Partial<ConnectionRequest>
  ): Promise<ConnectionRequest | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.updatedAt !== undefined) { fields.push(`updated_at = $${idx++}`); values.push(updates.updatedAt); }
    if (updates.lastObservation !== undefined) { fields.push(`last_observation = $${idx++}`); values.push(updates.lastObservation); }
    if (updates.documentsCount !== undefined) { fields.push(`documents_count = $${idx++}`); values.push(updates.documentsCount); }

    if (fields.length === 0) return this.getById(id) ?? null;

    values.push(id);
    const { rows } = await getPool().query(
      `UPDATE connection_requests SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] ? rowToRequest(rows[0]) : null;
  },

  async nextId(): Promise<number> {
    const { rows } = await getPool().query(
      "SELECT nextval('requests_seq') AS id"
    );
    return parseInt(rows[0].id);
  },

  async buildFromFormData(
    formData: Record<string, Record<string, unknown>>,
    transformer: Transformer | undefined
  ): Promise<ConnectionRequest> {
    const step2 = (formData.step2 ?? {}) as Record<string, string>;
    const step4 = (formData.step4 ?? {}) as Record<string, string>;
    const step6 = (formData.step6 ?? {}) as { generators?: Array<{ capacidadKW?: number; cantidad?: number }> };
    const step7 = (formData.step7 ?? {}) as { files?: unknown[] };

    const distributorName = step4.empresaDistribuidora as DistributorName;
    const totalKw = (step6.generators ?? []).reduce(
      (sum, g) => sum + (g.capacidadKW ?? 0) * (g.cantidad ?? 1),
      0
    );

    const now = new Date().toISOString();
    const id = await this.nextId();

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
