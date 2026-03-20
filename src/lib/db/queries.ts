import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  coerceDateString,
  coerceNumber,
  coerceString,
  pickFirstString,
} from "@/lib/growth/coerce";
import { DEMO_BASES, DEMO_DETAILS } from "@/lib/demo/accounts";

export type AccountBase = {
  companyId: string;
  companyName: string;
  ownerId?: string;
  ownerName?: string;
  companySummary?: string;
  companyRevenue?: number;
  companySize?: number;
};

export type TranscriptInsight = {
  id?: string;
  title?: string;
  summary: string;
  signals: string[];
};

export type AccountDetail = {
  companySummary?: string;
  deals: Array<{
    id?: string;
    name?: string;
    stage?: string;
    status?: string;
    amount?: number;
    closeDate?: string;
  }>;
  meetings: Array<{
    id?: string;
    title?: string;
    when?: string;
    ownerId?: string;
    ownerName?: string;
  }>;
  contacts: Array<{
    id?: string;
    name?: string;
    email?: string;
    title?: string;
    engagement?: string;
    lastActivityAt?: string;
  }>;
  transcriptInsights: TranscriptInsight[];
  warnings: string[];
};

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };

function ownerDisplayName(o: Record<string, unknown>): string | undefined {
  const first = coerceString(o.first_name);
  const last = coerceString(o.last_name);
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return pickFirstString(o, ["name", "full_name", "email", "owner_name"]);
}

export async function getAccountsOverview(): Promise<{
  accounts: AccountBase[];
  warnings: string[];
}> {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    return {
      accounts: DEMO_BASES,
      warnings: [e instanceof Error ? e.message : "Supabase client error"],
    };
  }

  try {
    // Run both queries in parallel
    const [companiesRes, ownersRes] = await Promise.all([
      supabase.from("companies").select("*").limit(500) as unknown as Promise<QueryResult<Record<string, unknown>>>,
      supabase.from("owners").select("*").limit(500) as unknown as Promise<QueryResult<Record<string, unknown>>>,
    ]);

    if (companiesRes.error) {
      return { accounts: DEMO_BASES, warnings: [`companies query failed: ${companiesRes.error.message}`] };
    }

    const ownersById = new Map<string, Record<string, unknown>>();
    for (const o of (ownersRes.data ?? [])) {
      const id = coerceString(o.id) ?? coerceString(o.owner_id);
      if (id) ownersById.set(id, o);
    }

    const accounts: AccountBase[] = (companiesRes.data ?? []).map((c) => {
      const companyId =
        coerceString(c.id) ??
        coerceString(c.company_id) ??
        coerceString(c.hubspot_company_id) ??
        coerceString(c.hs_object_id) ??
        "";
      const companyName =
        coerceString(c.name) ??
        coerceString(c.company_name) ??
        coerceString(c.domain) ??
        `Company ${companyId || "—"}`;
      const ownerId =
        coerceString(c.owner_id) ??
        coerceString(c.ownerId) ??
        coerceString(c.hs_owner_id) ??
        coerceString(c.cx_owner);
      const owner = ownerId && ownersById.has(ownerId) ? ownersById.get(ownerId) : undefined;
      return {
        companyId,
        companyName,
        ownerId,
        ownerName: owner ? ownerDisplayName(owner) : undefined,
        companySummary: coerceString(c.summary) ?? coerceString(c.description) ?? coerceString(c.notes),
        companyRevenue: coerceNumber((c as Record<string, unknown>).annual_revenue ?? (c as Record<string, unknown>).revenue ?? (c as Record<string, unknown>).arr),
        companySize: coerceNumber((c as Record<string, unknown>).number_of_employees ?? (c as Record<string, unknown>).employee_count ?? (c as Record<string, unknown>).employees ?? (c as Record<string, unknown>).size),
      };
    });

    const valid = accounts.filter((a) => a.companyId);
    const existingIds = new Set(valid.map((a) => a.companyId));
    return {
      accounts: [...valid, ...DEMO_BASES.filter((d) => !existingIds.has(d.companyId))],
      warnings: [],
    };
  } catch (e) {
    // Timeout or network error — serve demo data immediately
    return {
      accounts: DEMO_BASES,
      warnings: [e instanceof Error ? e.message : "Supabase unreachable — showing demo data"],
    };
  }
}

export async function getAccountsOverviewById(
  companyId: string,
): Promise<AccountBase | null> {
  // Short-circuit for demo accounts — no DB call needed
  if (companyId.startsWith("demo-")) {
    return DEMO_BASES.find((a) => a.companyId === companyId) ?? null;
  }
  const { accounts } = await getAccountsOverview();
  return accounts.find((a) => a.companyId === companyId) ?? null;
}

export async function getAccountsSignals(companyIds: string[]): Promise<{
  byCompanyId: Map<string, Pick<AccountDetail, "deals" | "meetings" | "contacts" | "transcriptInsights">>;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const byCompanyId = new Map<
    string,
    Pick<AccountDetail, "deals" | "meetings" | "contacts" | "transcriptInsights">
  >();

  for (const id of companyIds) {
    byCompanyId.set(id, { deals: [], meetings: [], contacts: [], transcriptInsights: [] });
  }

  // Inject demo signals first (works even if Supabase fails)
  for (const id of companyIds) {
    if (id.startsWith("demo-") && DEMO_DETAILS[id]) {
      const d = DEMO_DETAILS[id];
      byCompanyId.set(id, {
        deals: d.deals,
        meetings: d.meetings,
        contacts: d.contacts,
        transcriptInsights: d.transcriptInsights,
      });
    }
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    return {
      byCompanyId,
      warnings: [e instanceof Error ? e.message : "Supabase client error"],
    };
  }

  const realIds = companyIds.filter((id) => !id.startsWith("demo-") && id).slice(0, 200);
  if (realIds.length === 0) return { byCompanyId, warnings };

  try {
    // ── Round 1: deals + contacts in parallel ────────────────────────────────
    const [dealsRes, contactsRes] = await Promise.all([
      supabase.from("deals").select("*").in("company_id", realIds).limit(2000) as unknown as Promise<QueryResult<Record<string, unknown>>>,
      supabase.from("contacts").select("id,company_id,first_name,last_name,email,job_title,lifecycle_stage,lead_status,updated_at").in("company_id", realIds).limit(5000) as unknown as Promise<QueryResult<Record<string, unknown>>>,
    ]);

    for (const d of dealsRes.data ?? []) {
      const cid = coerceString(d.company_id);
      if (!cid || !byCompanyId.has(cid)) continue;
      byCompanyId.get(cid)!.deals.push({
        id: coerceString(d.id) ?? coerceString(d.deal_id),
        name: coerceString(d.deal_name) ?? coerceString(d.name) ?? coerceString(d.dealname),
        stage: coerceString(d.deal_stage) ?? coerceString(d.stage) ?? coerceString(d.dealstage),
        status: coerceString(d.status),
        amount: coerceNumber(d.amount) ?? coerceNumber(d.deal_amount),
        closeDate: coerceDateString(d.close_date) ?? coerceDateString(d.closedate),
      });
    }

    const contactToCompany = new Map<string, string>();
    for (const c of contactsRes.data ?? []) {
      const cid = coerceString(c.company_id);
      const contactId = coerceString(c.id);
      if (!cid || !contactId || !byCompanyId.has(cid)) continue;
      contactToCompany.set(contactId, cid);
      const first = coerceString(c.first_name);
      const last = coerceString(c.last_name);
      byCompanyId.get(cid)!.contacts.push({
        id: contactId,
        name: (first || last) ? [first, last].filter(Boolean).join(" ") : undefined,
        email: coerceString(c.email),
        title: coerceString(c.job_title),
        engagement: coerceString(c.lifecycle_stage) ?? coerceString(c.lead_status),
        lastActivityAt: coerceDateString(c.updated_at),
      });
    }

    const allContactIds = [...contactToCompany.keys()];
    if (allContactIds.length === 0) return { byCompanyId, warnings };

    // ── Round 2: both junction tables in parallel ────────────────────────────
    const [mcRes, tcRes] = await Promise.all([
      supabase.from("meeting_contacts").select("meeting_id,contact_id").in("contact_id", allContactIds).limit(5000) as unknown as Promise<QueryResult<Record<string, unknown>>>,
      supabase.from("call_transcript_contacts").select("call_transcript_id,contact_id").in("contact_id", allContactIds).limit(5000) as unknown as Promise<QueryResult<Record<string, unknown>>>,
    ]);

    const meetingToCompanies = new Map<string, Set<string>>();
    for (const row of mcRes.data ?? []) {
      const mid = coerceString(row.meeting_id);
      const cid = coerceString(row.contact_id) ? contactToCompany.get(coerceString(row.contact_id)!) : undefined;
      if (!mid || !cid) continue;
      if (!meetingToCompanies.has(mid)) meetingToCompanies.set(mid, new Set());
      meetingToCompanies.get(mid)!.add(cid);
    }

    const transcriptToCompanies = new Map<string, Set<string>>();
    for (const row of tcRes.data ?? []) {
      const tid = coerceString(row.call_transcript_id);
      const cid = coerceString(row.contact_id) ? contactToCompany.get(coerceString(row.contact_id)!) : undefined;
      if (!tid || !cid) continue;
      if (!transcriptToCompanies.has(tid)) transcriptToCompanies.set(tid, new Set());
      transcriptToCompanies.get(tid)!.add(cid);
    }

    // ── Round 3: meetings + transcripts in parallel ──────────────────────────
    const meetingIds = [...meetingToCompanies.keys()].slice(0, 2000);
    const transcriptIds = [...transcriptToCompanies.keys()].slice(0, 2000);

    const [meetingsRes, trRes] = (await Promise.all([
      meetingIds.length > 0
        ? supabase.from("meetings").select("id,title,start_time,owner_id").in("id", meetingIds).limit(2000)
        : Promise.resolve({ data: [], error: null }),
      transcriptIds.length > 0
        ? supabase.from("call_transcripts").select("id,title,summary,started_at").in("id", transcriptIds).limit(2000)
        : Promise.resolve({ data: [], error: null }),
    ])) as [QueryResult<Record<string, unknown>>, QueryResult<Record<string, unknown>>];

    for (const m of meetingsRes.data ?? []) {
      const mid = coerceString(m.id);
      if (!mid) continue;
      for (const cid of meetingToCompanies.get(mid) ?? []) {
        if (!byCompanyId.has(cid)) continue;
        byCompanyId.get(cid)!.meetings.push({ id: mid, title: coerceString(m.title), when: coerceDateString(m.start_time), ownerId: coerceString(m.owner_id) });
      }
    }

    for (const t of trRes.data ?? []) {
      const tid = coerceString(t.id);
      const summary = coerceString(t.summary);
      if (!tid || !summary) continue;
      for (const cid of transcriptToCompanies.get(tid) ?? []) {
        if (!byCompanyId.has(cid)) continue;
        byCompanyId.get(cid)!.transcriptInsights.push({ id: tid, title: coerceString(t.title), summary, signals: [] });
      }
    }
  } catch {
    // Timeout or network error — demo data already injected above, just return it
    warnings.push("Supabase unreachable — showing demo data");
  }

  return { byCompanyId, warnings };
}

export async function getAccountDetail(companyId: string): Promise<AccountDetail> {
  // Return demo detail directly for demo accounts
  if (companyId.startsWith("demo-") && DEMO_DETAILS[companyId]) {
    return DEMO_DETAILS[companyId];
  }

  const warnings: string[] = [];
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    return {
      companySummary: undefined,
      deals: [],
      meetings: [],
      contacts: [],
      transcriptInsights: [],
      warnings: [e instanceof Error ? e.message : "Supabase client error"],
    };
  }

  const detail: AccountDetail = {
    companySummary: undefined,
    deals: [],
    meetings: [],
    contacts: [],
    transcriptInsights: [],
    warnings,
  };

  try {
    // ── Round 1: summary + deals + contacts in parallel ─────────────────────
    const [companiesRes, dealsRes, contactsRes] = await Promise.all([
      supabase.from("companies").select("summary,description,notes").eq("id", companyId).limit(1) as unknown as Promise<QueryResult<Record<string, unknown>>>,
      supabase.from("deals").select("*").eq("company_id", companyId).order("create_date", { ascending: false }).limit(50) as unknown as Promise<QueryResult<Record<string, unknown>>>,
      supabase.from("contacts").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200) as unknown as Promise<QueryResult<Record<string, unknown>>>,
    ]);

    if (!companiesRes.error && companiesRes.data?.[0]) {
      const c = companiesRes.data[0];
      detail.companySummary = coerceString(c.summary) ?? coerceString(c.description) ?? coerceString(c.notes);
    }

    detail.deals = (dealsRes.data ?? []).map((d) => ({
      id: coerceString(d.id) ?? coerceString(d.deal_id),
      name: coerceString(d.deal_name) ?? coerceString(d.name) ?? coerceString(d.dealname),
      stage: coerceString(d.deal_stage) ?? coerceString(d.stage) ?? coerceString(d.dealstage),
      status: coerceString(d.status),
      amount: coerceNumber(d.amount) ?? coerceNumber(d.deal_amount),
      closeDate: coerceDateString(d.close_date) ?? coerceDateString(d.closedate),
    }));

    detail.contacts = (contactsRes.data ?? []).map((c) => {
      const first = coerceString(c.first_name);
      const last = coerceString(c.last_name);
      return {
        id: coerceString(c.id) ?? coerceString(c.contact_id),
        name: (first || last) ? [first, last].filter(Boolean).join(" ") : pickFirstString(c, ["name", "full_name"]) ?? undefined,
        email: coerceString(c.email),
        title: coerceString(c.job_title) ?? coerceString(c.title),
        engagement: coerceString(c.lifecycle_stage) ?? coerceString(c.lead_status) ?? coerceString(c.engagement),
        lastActivityAt: coerceDateString(c.updated_at) ?? coerceDateString(c.last_activity_at),
      };
    });

    const contactIds = detail.contacts.map((c) => c.id).filter(Boolean) as string[];
    if (contactIds.length === 0) return detail;

    // ── Round 2: both junction tables in parallel ────────────────────────────
    const [mcRes, tcRes] = await Promise.all([
      supabase.from("meeting_contacts").select("meeting_id").in("contact_id", contactIds).limit(500) as unknown as Promise<QueryResult<Record<string, unknown>>>,
      supabase.from("call_transcript_contacts").select("call_transcript_id").in("contact_id", contactIds).limit(500) as unknown as Promise<QueryResult<Record<string, unknown>>>,
    ]);

    const meetingIds = [...new Set((mcRes.data ?? []).map((r) => coerceString(r.meeting_id)).filter(Boolean) as string[])].slice(0, 200);
    const transcriptIds = [...new Set((tcRes.data ?? []).map((r) => coerceString(r.call_transcript_id)).filter(Boolean) as string[])].slice(0, 100);

    // ── Round 3: meetings + transcripts in parallel ──────────────────────────
    const [meetingsRes, trRes] = (await Promise.all([
      meetingIds.length > 0
        ? supabase.from("meetings").select("id,title,start_time,owner_id").in("id", meetingIds).order("start_time", { ascending: false }).limit(100)
        : Promise.resolve({ data: [], error: null }),
      transcriptIds.length > 0
        ? supabase.from("call_transcripts").select("id,title,summary,started_at").in("id", transcriptIds).order("started_at", { ascending: false }).limit(50)
        : Promise.resolve({ data: [], error: null }),
    ])) as [QueryResult<Record<string, unknown>>, QueryResult<Record<string, unknown>>];

    detail.meetings = (meetingsRes.data ?? []).map((m) => ({
      id: coerceString(m.id),
      title: coerceString(m.title),
      when: coerceDateString(m.start_time),
      ownerId: coerceString(m.owner_id),
    }));

    detail.transcriptInsights = (trRes.data ?? [])
      .map((t) => {
        const summary = coerceString(t.summary);
        if (!summary) return null;
        return { id: coerceString(t.id), title: coerceString(t.title), summary, signals: [] } satisfies TranscriptInsight;
      })
      .filter(Boolean) as TranscriptInsight[];
  } catch {
    // Timeout or network error — return empty detail, page still renders
    warnings.push("Supabase unreachable — showing demo data");
  }

  return detail;
}
