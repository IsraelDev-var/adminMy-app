import { NextRequest, NextResponse } from "next/server";
import { transformersStore } from "@/src/lib/transformersStore";
import type { DistributorName, TransformerStatus } from "@/src/types";

const CORS = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const ede = req.nextUrl.searchParams.get("ede") as DistributorName | null;
  const status = req.nextUrl.searchParams.get("status") as TransformerStatus | null;

  let data = ede ? transformersStore.getByEde(ede) : transformersStore.getAll();
  if (status) data = data.filter((t) => t.status === status);

  return NextResponse.json(data, { headers: CORS });
}
