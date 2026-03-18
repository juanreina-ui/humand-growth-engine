import { NextResponse } from "next/server";
import { getAccountDetail, getAccountsOverviewById } from "@/lib/db/queries";
import { scoreAccountFromDetail } from "@/lib/growth/scoring";
import { generateOutreach } from "@/lib/ai/outreach";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { companyId?: string; kind?: "email" | "internal_note" }
    | null;

  const companyId = body?.companyId;
  const kind = body?.kind ?? "email";

  if (!companyId) {
    return NextResponse.json(
      { error: "Missing companyId" },
      { status: 400 },
    );
  }

  const base = await getAccountsOverviewById(companyId);
  if (!base) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const detail = await getAccountDetail(companyId);
  const scored = scoreAccountFromDetail(base, detail);

  const text = generateOutreach({
    kind,
    companyName: base.companyName,
    ownerName: base.ownerName,
    scored,
    transcriptInsights: detail.transcriptInsights,
  });

  return NextResponse.json({ text });
}

