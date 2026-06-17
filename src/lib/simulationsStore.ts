import { getPool } from "./db";
import type { StoredSimulation } from "@/src/types";

function rowToSimulation(row: Record<string, unknown>): StoredSimulation {
  return {
    id: row.id as string,
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
    ubicacion: row.ubicacion as string,
    categoria: row.categoria as "hogar" | "negocio",
    facturaActual: parseFloat(String(row.factura_actual)),
    consumoMensualKwh: parseFloat(String(row.consumo_mensual_kwh)),
    tamanoSistemaKwp: parseFloat(String(row.tamano_sistema_kwp)),
    numeroPaneles: row.numero_paneles as number,
    produccionMensualKwh: parseFloat(String(row.produccion_mensual_kwh)),
    costoInversion: parseFloat(String(row.costo_inversion)),
    ahorroMensual: parseFloat(String(row.ahorro_mensual)),
    porcentajeAhorro: parseFloat(String(row.porcentaje_ahorro)),
    roiAnos: parseFloat(String(row.roi_anos)),
    co2EvitadoAnual: parseFloat(String(row.co2_evitado_anual)),
    equivalenteArboles: row.equivalente_arboles as number,
    viabilidad: row.viabilidad as string,
  };
}

export const simulationsStore = {
  async getAll(): Promise<StoredSimulation[]> {
    const { rows } = await getPool().query(
      "SELECT * FROM simulations ORDER BY created_at DESC"
    );
    return rows.map(rowToSimulation);
  },

  async add(sim: Omit<StoredSimulation, "id" | "createdAt">): Promise<StoredSimulation> {
    const id = `SIM-${Date.now()}`;
    const now = new Date().toISOString();

    const { rows } = await getPool().query(
      `INSERT INTO simulations
        (id, created_at, ubicacion, categoria, factura_actual,
         consumo_mensual_kwh, tamano_sistema_kwp, numero_paneles,
         produccion_mensual_kwh, costo_inversion, ahorro_mensual,
         porcentaje_ahorro, roi_anos, co2_evitado_anual,
         equivalente_arboles, viabilidad)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        id, now, sim.ubicacion, sim.categoria, sim.facturaActual,
        sim.consumoMensualKwh, sim.tamanoSistemaKwp, sim.numeroPaneles,
        sim.produccionMensualKwh, sim.costoInversion, sim.ahorroMensual,
        sim.porcentajeAhorro, sim.roiAnos, sim.co2EvitadoAnual,
        sim.equivalenteArboles, sim.viabilidad,
      ]
    );
    return rowToSimulation(rows[0]);
  },

  async count(): Promise<number> {
    const { rows } = await getPool().query("SELECT COUNT(*) FROM simulations");
    return parseInt(rows[0].count);
  },
};
