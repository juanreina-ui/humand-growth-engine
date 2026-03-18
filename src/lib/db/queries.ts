import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  coerceDateString,
  coerceNumber,
  coerceString,
  pickFirstString,
} from "@/lib/growth/coerce";

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

export async function getAccountsOverview(): Promise<{
  accounts: AccountBase[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    return {
      accounts: [],
      warnings: [e instanceof Error ? e.message : "Supabase client error"],
    };
  }

  const companiesRes = (await supabase
    .from("companies")
    .select("*")
    .limit(200)) as QueryResult<Record<string, unknown>>;

  if (companiesRes.error) {
    return {
      accounts: [],
      warnings: [`companies query failed: ${companiesRes.error.message}`],
    };
  }

  const ownersRes = (await supabase
    .from("owners")
    .select("*")
    .limit(500)) as QueryResult<Record<string, unknown>>;

  if (ownersRes.error) {
    warnings.push(`owners query failed: ${ownersRes.error.message}`);
  }

  const ownersById = new Map<string, Record<string, unknown>>();
  for (const o of ownersRes.data ?? []) {
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
      coerceString(c.hs_owner_id);

    const owner =
      ownerId && ownersById.has(ownerId) ? ownersById.get(ownerId) : undefined;

    const ownerName = owner
      ? pickFirstString(owner, ["name", "full_name", "email", "owner_name"])
      : undefined;

    const companyRevenue = coerceNumber(
      (c as Record<string, unknown>).revenue ??
        (c as Record<string, unknown>).annual_revenue ??
        (c as Record<string, unknown>).arr,
    );
    const companySize = coerceNumber(
      (c as Record<string, unknown>).size ??
        (c as Record<string, unknown>).employee_count ??
        (c as Record<string, unknown>).employees,
    );

    const companySummary =
      coerceString(c.summary) ??
      coerceString(c.description) ??
      coerceString(c.notes);

    return {
      companyId,
      companyName,
      ownerId,
      ownerName,
      companySummary,
      companyRevenue,
      companySize,
    };
  });

  const valid = accounts.filter((a) => a.companyId);
  if (valid.length === 0 && accounts.length > 0) {
    warnings.push(
      "Could not detect a company id column (expected one of: id/company_id/hs_object_id).",
    );
  }

  return { accounts: valid, warnings };
}

export async function getAccountsOverviewById(
  companyId: string,
): Promise<AccountBase | null> {
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
    byCompanyId.set(id, {
      deals: [],
      meetings: [],
      contacts: [],
      transcriptInsights: [],
    });
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

  const ids = companyIds.filter(Boolean).slice(0, 200);
  if (ids.length === 0) return { byCompanyId, warnings };

  const dealsRes = (await supabase
    .from("deals")
    .select("*")
    .in("company_id", ids)
    .limit(2000)) as QueryResult<Record<string, unknown>>;
  if (dealsRes.error) warnings.push(`deals overview query failed: ${dealsRes.error.message}`);
  for (const d of dealsRes.data ?? []) {
    const cid = coerceString(d.company_id);
    if (!cid || !byCompanyId.has(cid)) continue;
    byCompanyId.get(cid)!.deals.push({
      id: coerceString(d.id) ?? coerceString(d.deal_id),
      name: coerceString(d.name) ?? coerceString(d.dealname),
      stage: coerceString(d.stage) ?? coerceString(d.dealstage),
      status: coerceString(d.status),
      amount: coerceNumber(d.amount) ?? coerceNumber(d.deal_amount),
      closeDate: coerceDateString(d.close_date) ?? coerceDateString(d.closedate),
    });
  }

  const meetingsRes = (await supabase
    .from("meetings")
    .select("*")
    .in("company_id", ids)
    .limit(2000)) as QueryResult<Record<string, unknown>>;
  if (meetingsRes.error)
    warnings.push(`meetings overview query failed: ${meetingsRes.error.message}`);
  for (const m of meetingsRes.data ?? []) {
    const cid = coerceString(m.company_id);
    if (!cid || !byCompanyId.has(cid)) continue;
    byCompanyId.get(cid)!.meetings.push({
      id: coerceString(m.id) ?? coerceString(m.meeting_id),
      title: coerceString(m.title) ?? coerceString(m.subject),
      when:
        coerceDateString(m.occurred_at) ??
        coerceDateString(m.start_time) ??
        coerceDateString(m.created_at),
      ownerId: coerceString(m.owner_id) ?? coerceString(m.hs_owner_id),
      ownerName:
        coerceString(m.owner_name) ??
        coerceString(m.organizer) ??
        coerceString(m.owner),
    });
  }

  const contactsRes = (await supabase
    .from("contacts")
    .select("*")
    .in("company_id", ids)
    .limit(5000)) as QueryResult<Record<string, unknown>>;
  if (contactsRes.error)
    warnings.push(`contacts overview query failed: ${contactsRes.error.message}`);
  for (const c of contactsRes.data ?? []) {
    const cid = coerceString(c.company_id);
    if (!cid || !byCompanyId.has(cid)) continue;
    byCompanyId.get(cid)!.contacts.push({
      id: coerceString(c.id) ?? coerceString(c.contact_id),
      name: (() => {
        const direct = pickFirstString(c, ["name", "full_name"]);
        if (direct) return direct;
        const joined = [coerceString(c.first_name), coerceString(c.last_name)]
          .filter(Boolean)
          .join(" ")
          .trim();
        return joined || undefined;
      })(),
      email: coerceString(c.email),
      title: coerceString(c.title) ?? coerceString(c.job_title),
      engagement:
        coerceString(c.engagement) ??
        coerceString(c.lifecycle_stage) ??
        coerceString(c.status),
      lastActivityAt:
        coerceDateString(c.last_activity_at) ??
        coerceDateString(c.last_contacted_at),
    });
  }

  const transcriptsRes = (await supabase
    .from("call_transcripts")
    .select("*")
    .in("company_id", ids)
    .limit(2000)) as QueryResult<Record<string, unknown>>;
  if (transcriptsRes.error)
    warnings.push(`call_transcripts overview query failed: ${transcriptsRes.error.message}`);
  for (const t of transcriptsRes.data ?? []) {
    const cid = coerceString(t.company_id);
    if (!cid || !byCompanyId.has(cid)) continue;
    const summary =
      coerceString(t.summary) ??
      coerceString(t.call_summary) ??
      coerceString(t.notes) ??
      coerceString(t.transcript_excerpt) ??
      coerceString(t.transcript);
    if (!summary) continue;

    const title =
      coerceString(t.title) ?? coerceString(t.subject) ?? coerceString(t.call_title);
    const signalsRaw =
      coerceString(t.signals) ?? coerceString(t.tags) ?? coerceString(t.key_topics);
    const signals = signalsRaw
      ? signalsRaw
          .split(/,|\n|;|•/g)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];

    byCompanyId.get(cid)!.transcriptInsights.push({
      id: coerceString(t.id) ?? coerceString(t.transcript_id),
      title,
      summary,
      signals,
    });
  }

  return { byCompanyId, warnings };
}

export async function getAccountDetail(companyId: string): Promise<AccountDetail> {
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

  const companiesRes = (await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .limit(1)) as QueryResult<Record<string, unknown>>;

  if (!companiesRes.error && (companiesRes.data?.[0] ?? null)) {
    const c = companiesRes.data![0];
    detail.companySummary =
      coerceString(c.summary) ??
      coerceString(c.description) ??
      coerceString(c.notes);
  }

  const dealsRes = (await supabase
    .from("deals")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50)) as QueryResult<Record<string, unknown>>;
  if (dealsRes.error) {
    warnings.push(`deals query failed: ${dealsRes.error.message}`);
  } else {
    detail.deals = (dealsRes.data ?? []).map((d) => ({
      id: coerceString(d.id) ?? coerceString(d.deal_id),
      name: coerceString(d.name) ?? coerceString(d.dealname),
      stage: coerceString(d.stage) ?? coerceString(d.dealstage),
      status: coerceString(d.status),
      amount: coerceNumber(d.amount) ?? coerceNumber(d.deal_amount),
      closeDate:
        coerceDateString(d.close_date) ?? coerceDateString(d.closedate),
    }));
  }

  const meetingsRes = (await supabase
    .from("meetings")
    .select("*")
    .eq("company_id", companyId)
    .order("occurred_at", { ascending: false })
    .limit(50)) as QueryResult<Record<string, unknown>>;
  if (meetingsRes.error) {
    warnings.push(`meetings query failed: ${meetingsRes.error.message}`);
  } else {
    detail.meetings = (meetingsRes.data ?? []).map((m) => ({
      id: coerceString(m.id) ?? coerceString(m.meeting_id),
      title: coerceString(m.title) ?? coerceString(m.subject),
      when:
        coerceDateString(m.occurred_at) ??
        coerceDateString(m.start_time) ??
        coerceDateString(m.created_at),
      ownerId: coerceString(m.owner_id) ?? coerceString(m.hs_owner_id),
      ownerName:
        coerceString(m.owner_name) ??
        coerceString(m.organizer) ??
        coerceString(m.owner),
    }));
  }

  const contactsRes = (await supabase
    .from("contacts")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200)) as QueryResult<Record<string, unknown>>;
  if (contactsRes.error) {
    warnings.push(`contacts query failed: ${contactsRes.error.message}`);
  } else {
    detail.contacts = (contactsRes.data ?? []).map((c) => ({
      id: coerceString(c.id) ?? coerceString(c.contact_id),
      name: (() => {
        const direct = pickFirstString(c, ["name", "full_name"]);
        if (direct) return direct;
        const joined = [coerceString(c.first_name), coerceString(c.last_name)]
          .filter(Boolean)
          .join(" ")
          .trim();
        return joined || undefined;
      })(),
      email: coerceString(c.email),
      title: coerceString(c.title) ?? coerceString(c.job_title),
      engagement:
        coerceString(c.engagement) ??
        coerceString(c.lifecycle_stage) ??
        coerceString(c.status),
      lastActivityAt:
        coerceDateString(c.last_activity_at) ??
        coerceDateString(c.last_contacted_at),
    }));
  }

  const transcriptsRes = (await supabase
    .from("call_transcripts")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50)) as QueryResult<Record<string, unknown>>;
  if (transcriptsRes.error) {
    warnings.push(
      `call_transcripts query failed: ${transcriptsRes.error.message}`,
    );
  } else {
    detail.transcriptInsights = (transcriptsRes.data ?? [])
      .map((t) => {
        const summary =
          coerceString(t.summary) ??
          coerceString(t.call_summary) ??
          coerceString(t.notes) ??
          coerceString(t.transcript_excerpt) ??
          coerceString(t.transcript);
        if (!summary) return null;

        const title =
          coerceString(t.title) ??
          coerceString(t.subject) ??
          coerceString(t.call_title);

        const signalsRaw =
          coerceString(t.signals) ??
          coerceString(t.tags) ??
          coerceString(t.key_topics);
        const signals = signalsRaw
          ? signalsRaw
              .split(/,|\n|;|•/g)
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 20)
          : [];

        return {
          id: coerceString(t.id) ?? coerceString(t.transcript_id),
          title,
          summary,
          signals,
        } satisfies TranscriptInsight;
      })
      .filter(Boolean) as TranscriptInsight[];
  }

  return detail;
}

