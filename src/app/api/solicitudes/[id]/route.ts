import { NextRequest, NextResponse } from "next/server";
import { requestsStore } from "@/src/lib/requestsStore";
import type { RequestStatus } from "@/src/types";

const CORS = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    const body = await req.json() as { status: RequestStatus; lastObservation?: string };

    const updated = requestsStore.update(numId, {
      status: body.status,
      updatedAt: new Date().toISOString(),
      ...(body.lastObservation ? { lastObservation: body.lastObservation } : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Solicitud no encontrada" },
        { status: 404, headers: CORS }
      );
    }

    return NextResponse.json({ success: true, request: updated }, { headers: CORS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ success: false, message }, { status: 500, headers: CORS });
  }
}
