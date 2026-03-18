import type { AccountBase, AccountDetail, TranscriptInsight } from "@/lib/db/queries";

export type ScoredAccount = {
  growthScore: number; // 0-100
  recentMeetings: number;
  openDeals: number;
  engagedContacts: number;
  companySizeScore: number; // 0-20
  needSignals: number;
  sentiment: "positive" | "neutral" | "negative";
  riskSignals: number;
  topOpportunity: string;
  suggestedNextAction: string;
};

const DAYS_30 = 1000 * 60 * 60 * 24 * 30;

function isRecent(isoDate?: string) {
  if (!isoDate) return false;
  const t = new Date(isoDate).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= DAYS_30;
}

function classifySentimentFromText(text: string): "positive" | "neutral" | "negative" {
  const t = text.toLowerCase();
  const neg = ["frustrat", "confus", "bug", "broken", "slow", "cancel", "churn", "angry", "issue"];
  const pos = ["love", "great", "helpful", "excited", "value", "success", "improv"];
  if (neg.some((k) => t.includes(k))) return "negative";
  if (pos.some((k) => t.includes(k))) return "positive";
  return "neutral";
}

function extractNeedSignals(transcripts: TranscriptInsight[]) {
  const keywords = [
    { k: "integration", label: "Integrations" },
    { k: "api", label: "API / automation" },
    { k: "report", label: "Reporting" },
    { k: "dashboard", label: "Analytics" },
    { k: "permission", label: "Permissions" },
    { k: "role", label: "Roles" },
    { k: "sso", label: "SSO" },
    { k: "security", label: "Security review" },
    { k: "workflow", label: "Workflow" },
    { k: "onboarding", label: "Onboarding" },
    { k: "billing", label: "Billing / plan" },
  ];

  const hits = new Map<string, number>();
  for (const t of transcripts) {
    const hay = `${t.title ?? ""}\n${t.summary}\n${t.signals.join(" ")}`.toLowerCase();
    for (const kw of keywords) {
      if (hay.includes(kw.k)) hits.set(kw.label, (hits.get(kw.label) ?? 0) + 1);
    }
  }
  const top = [...hits.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
  return { count: hits.size, top };
}

export function scoreAccount(a: AccountBase): ScoredAccount {
  // Overview-only scoring uses placeholders; detail scoring will override with real counts.
  const companySizeScore = a.companySize ? Math.min(20, Math.round(Math.log10(a.companySize + 1) * 10)) : 6;
  const growthScore = Math.max(0, Math.min(100, 20 + companySizeScore));
  return {
    growthScore,
    recentMeetings: 0,
    openDeals: 0,
    engagedContacts: 0,
    companySizeScore,
    needSignals: 0,
    sentiment: "neutral",
    riskSignals: 1,
    topOpportunity: "Run a value check-in to uncover expansion triggers.",
    suggestedNextAction: "Schedule a QBR + confirm success criteria for next 90 days.",
  };
}

export function scoreAccountFromDetail(base: AccountBase, detail: AccountDetail): ScoredAccount {
  const meetingsRecent = detail.meetings.filter((m) => isRecent(m.when)).length;

  const openDeals = detail.deals.filter((d) => {
    const s = `${d.stage ?? ""} ${d.status ?? ""}`.toLowerCase();
    if (!s) return true;
    return !["closed", "won", "lost"].some((x) => s.includes(x));
  }).length;

  const engagedContacts = detail.contacts.filter((c) => isRecent(c.lastActivityAt)).length || detail.contacts.length;

  const { count: needSignals, top: topNeeds } = extractNeedSignals(detail.transcriptInsights);

  const sentiment = (() => {
    const text = detail.transcriptInsights.map((t) => t.summary).join("\n");
    return text ? classifySentimentFromText(text) : "neutral";
  })();

  const companySizeScore = base.companySize
    ? Math.min(20, Math.round(Math.log10(base.companySize + 1) * 10))
    : base.companyRevenue
      ? Math.min(20, Math.round(Math.log10(base.companyRevenue + 1) * 4))
      : 6;

  const meetingScore = Math.min(25, meetingsRecent * 6);
  const dealsScore = Math.min(25, openDeals * 8);
  const contactsScore = Math.min(20, engagedContacts >= 8 ? 20 : engagedContacts * 2.5);
  const needsScore = Math.min(20, needSignals * 6);
  const sentimentAdj = sentiment === "positive" ? 6 : sentiment === "negative" ? -6 : 0;

  const raw = 10 + companySizeScore + meetingScore + dealsScore + contactsScore + needsScore + sentimentAdj;
  const growthScore = Math.max(0, Math.min(100, Math.round(raw)));

  const riskSignals =
    (meetingsRecent === 0 ? 1 : 0) +
    (openDeals === 0 ? 1 : 0) +
    (sentiment === "negative" ? 2 : 0) +
    (needSignals >= 2 && meetingsRecent === 0 ? 1 : 0);

  const topOpportunity =
    needSignals > 0
      ? `Lean into ${topNeeds[0]}: position it as the shortest path to their next milestone.`
      : openDeals > 0
        ? "Unblock active deal(s) with a scoped success plan and timeline."
        : meetingsRecent > 0
          ? "Convert recent engagement into an expansion hypothesis and pilot."
          : "Re-activate stakeholders with a value recap + 15-min alignment call.";

  const suggestedNextAction =
    sentiment === "negative"
      ? "Send a quick issue-resolution note, confirm ownership, and set a 7-day follow-up."
      : openDeals > 0
        ? "Draft a mutual action plan and confirm decision criteria with champions."
        : meetingsRecent > 0
          ? "Propose a targeted enablement session tied to their stated goals."
          : "Ask for a pulse-check and schedule a 20-min success review.";

  return {
    growthScore,
    recentMeetings: meetingsRecent,
    openDeals,
    engagedContacts,
    companySizeScore,
    needSignals,
    sentiment,
    riskSignals,
    topOpportunity,
    suggestedNextAction,
  };
}

