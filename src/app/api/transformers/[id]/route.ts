import { NextRequest, NextResponse } from "next/server";
import { transformersStore } from "@/src/lib/transformersStore";
import type { TransformerStatus } from "@/src/types";

const CORS = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const transformer = transformersStore.getById(Number(id));
  if (!transformer) {
    return NextResponse.json({ success: false, message: "Transformador no encontrado" }, { status: 404, headers: CORS });
  }
  return NextResponse.json(transformer, { headers: CORS });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as { status: TransformerStatus; availableCapacityKva: number };

    if (!body.status || body.availableCapacityKva == null) {
      return NextResponse.json(
        { success: false, message: "Faltan campos: status, availableCapacityKva" },
        { status: 400, headers: CORS }
      );
    }

    const updated = transformersStore.updateStatus(Number(id), body.status, body.availableCapacityKva);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Transformador no encontrado" }, { status: 404, headers: CORS });
    }

    return NextResponse.json({ success: true, transformer: updated }, { headers: CORS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ success: false, message }, { status: 500, headers: CORS });
  }
}
