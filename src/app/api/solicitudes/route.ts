import { NextRequest, NextResponse } from "next/server";
import { requestsStore } from "@/src/lib/requestsStore";
import { transformersStore } from "@/src/lib/transformersStore";
import type { DistributorName } from "@/src/types";

const CORS = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const ede = req.nextUrl.searchParams.get("ede") as DistributorName | null;
  const data = ede
    ? await requestsStore.getByEde(ede)
    : await requestsStore.getAll();
  return NextResponse.json(data, { headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formData } = body as { formData: Record<string, Record<string, unknown>> };

    if (!formData?.step4?.empresaDistribuidora) {
      return NextResponse.json(
        { success: false, message: "Falta la empresa distribuidora (step4.empresaDistribuidora)" },
        { status: 400, headers: CORS }
      );
    }

    const distributorName = formData.step4.empresaDistribuidora as DistributorName;
    const transformer = await transformersStore.findAvailableForEde(distributorName);
    const newRequest = await requestsStore.buildFromFormData(formData, transformer);
    await requestsStore.add(newRequest);

    return NextResponse.json({ success: true, request: newRequest }, { status: 201, headers: CORS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ success: false, message }, { status: 500, headers: CORS });
  }
}
