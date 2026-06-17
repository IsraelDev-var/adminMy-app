import { getPool } from "./db";
import { mockTransformers, mockRequests } from "@/src/data/mockData";

export async function initializeDatabase() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transformers (
      id INTEGER PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      distributor_id INTEGER NOT NULL,
      distributor_name TEXT NOT NULL,
      service_zone TEXT NOT NULL,
      total_capacity_kva NUMERIC NOT NULL,
      available_capacity_kva NUMERIC NOT NULL,
      status TEXT NOT NULL,
      availability_percent INTEGER NOT NULL,
      last_updated TIMESTAMPTZ NOT NULL,
      lat NUMERIC NOT NULL,
      lng NUMERIC NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connection_requests (
      id INTEGER PRIMARY KEY,
      expedient_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      company_name TEXT,
      transformer_id INTEGER NOT NULL,
      transformer_code TEXT NOT NULL,
      service_zone TEXT NOT NULL,
      distributor_name TEXT NOT NULL,
      request_type TEXT NOT NULL,
      status TEXT NOT NULL,
      required_capacity_kw NUMERIC NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      documents_count INTEGER NOT NULL DEFAULT 0,
      last_observation TEXT
    );

    CREATE SEQUENCE IF NOT EXISTS transformers_seq START 1;
    CREATE SEQUENCE IF NOT EXISTS requests_seq START 1;

    CREATE TABLE IF NOT EXISTS simulations (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL,
      ubicacion TEXT NOT NULL,
      categoria TEXT NOT NULL,
      factura_actual NUMERIC NOT NULL,
      consumo_mensual_kwh NUMERIC NOT NULL,
      tamano_sistema_kwp NUMERIC NOT NULL,
      numero_paneles INTEGER NOT NULL,
      produccion_mensual_kwh NUMERIC NOT NULL,
      costo_inversion NUMERIC NOT NULL,
      ahorro_mensual NUMERIC NOT NULL,
      porcentaje_ahorro NUMERIC NOT NULL,
      roi_anos NUMERIC NOT NULL,
      co2_evitado_anual NUMERIC NOT NULL,
      equivalente_arboles INTEGER NOT NULL,
      viabilidad TEXT NOT NULL
    );
  `);

  // Seed transformers only if empty
  const { rows: tRows } = await pool.query("SELECT COUNT(*) FROM transformers");
  if (parseInt(tRows[0].count) === 0) {
    for (const t of mockTransformers) {
      await pool.query(
        `INSERT INTO transformers
          (id, code, distributor_id, distributor_name, service_zone,
           total_capacity_kva, available_capacity_kva, status,
           availability_percent, last_updated, lat, lng)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT DO NOTHING`,
        [
          t.id, t.code, t.distributorId, t.distributorName, t.serviceZone,
          t.totalCapacityKva, t.availableCapacityKva, t.status,
          t.availabilityPercent, t.lastUpdated, t.lat, t.lng,
        ]
      );
    }
    const maxId = Math.max(...mockTransformers.map((t) => t.id));
    await pool.query(`SELECT setval('transformers_seq', $1)`, [maxId]);
  }

  // Seed requests only if empty
  const { rows: rRows } = await pool.query("SELECT COUNT(*) FROM connection_requests");
  if (parseInt(rRows[0].count) === 0) {
    for (const r of mockRequests) {
      await pool.query(
        `INSERT INTO connection_requests
          (id, expedient_number, user_id, user_name, user_email, company_name,
           transformer_id, transformer_code, service_zone, distributor_name,
           request_type, status, required_capacity_kw, created_at, updated_at,
           documents_count, last_observation)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT DO NOTHING`,
        [
          r.id, r.expedientNumber, r.userId, r.userName, r.userEmail,
          r.companyName ?? null, r.transformerId, r.transformerCode,
          r.serviceZone, r.distributorName, r.requestType, r.status,
          r.requiredCapacityKw, r.createdAt, r.updatedAt,
          r.documentsCount, r.lastObservation ?? null,
        ]
      );
    }
    const maxId = Math.max(...mockRequests.map((r) => r.id));
    await pool.query(`SELECT setval('requests_seq', $1)`, [maxId]);
  }
}
