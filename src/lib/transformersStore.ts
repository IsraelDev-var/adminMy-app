import { getPool } from "./db";
import type { Transformer, TransformerStatus, DistributorName } from "@/src/types";

function rowToTransformer(row: Record<string, unknown>): Transformer {
  return {
    id: row.id as number,
    code: row.code as string,
    distributorId: row.distributor_id as number,
    distributorName: row.distributor_name as string,
    serviceZone: row.service_zone as string,
    totalCapacityKva: parseFloat(String(row.total_capacity_kva)),
    availableCapacityKva: parseFloat(String(row.available_capacity_kva)),
    status: row.status as TransformerStatus,
    availabilityPercent: row.availability_percent as number,
    lastUpdated: row.last_updated instanceof Date
      ? row.last_updated.toISOString()
      : String(row.last_updated),
    lat: parseFloat(String(row.lat)),
    lng: parseFloat(String(row.lng)),
  };
}

export const transformersStore = {
  async getAll(): Promise<Transformer[]> {
    const { rows } = await getPool().query("SELECT * FROM transformers ORDER BY id");
    return rows.map(rowToTransformer);
  },

  async getByEde(ede: DistributorName): Promise<Transformer[]> {
    const { rows } = await getPool().query(
      "SELECT * FROM transformers WHERE distributor_name = $1 ORDER BY id",
      [ede]
    );
    return rows.map(rowToTransformer);
  },

  async getById(id: number): Promise<Transformer | undefined> {
    const { rows } = await getPool().query(
      "SELECT * FROM transformers WHERE id = $1",
      [id]
    );
    return rows[0] ? rowToTransformer(rows[0]) : undefined;
  },

  async findAvailableForEde(ede: DistributorName): Promise<Transformer | undefined> {
    const { rows } = await getPool().query(
      `SELECT * FROM transformers
       WHERE distributor_name = $1
       ORDER BY CASE WHEN status = 'Disponible' THEN 0 ELSE 1 END, id
       LIMIT 1`,
      [ede]
    );
    return rows[0] ? rowToTransformer(rows[0]) : undefined;
  },

  async updateStatus(
    id: number,
    status: TransformerStatus,
    availableCapacityKva: number
  ): Promise<Transformer | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const availabilityPercent = Math.round(
      (availableCapacityKva / existing.totalCapacityKva) * 100
    );
    const now = new Date().toISOString();

    const { rows } = await getPool().query(
      `UPDATE transformers
       SET status = $1, available_capacity_kva = $2,
           availability_percent = $3, last_updated = $4
       WHERE id = $5
       RETURNING *`,
      [status, availableCapacityKva, availabilityPercent, now, id]
    );
    return rows[0] ? rowToTransformer(rows[0]) : null;
  },
};
