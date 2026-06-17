import { NextRequest, NextResponse } from "next/server";
import { simulationsStore } from "@/src/lib/simulationsStore";
import type { StoredSimulation } from "@/src/types";

const CORS = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  return NextResponse.json(await simulationsStore.getAll(), { headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Omit<StoredSimulation, "id" | "createdAt">;

    if (!body.ubicacion || !body.categoria || body.facturaActual == null) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos: ubicacion, categoria, facturaActual" },
        { status: 400, headers: CORS }
      );
    }

    const stored = await simulationsStore.add(body);
    return NextResponse.json({ success: true, simulation: stored }, { status: 201, headers: CORS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ success: false, message }, { status: 500, headers: CORS });
  }
}
