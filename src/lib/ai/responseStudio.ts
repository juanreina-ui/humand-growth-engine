import type { ChatAccount } from "@/ui/AccountsChat";
import { buildOutreachMessage, type MessageType } from "@/lib/ai/growthAi";

export type Draft = {
  id: string;
  companyId: string;
  companyName: string;
  ownerName: string | null;
  to: string;
  subject: string;
  body: string;
  context: string;
  type: MessageType;
  urgency: "critical" | "high" | "medium";
  growthScore: number;
  companyRevenue: number | null;
};

function getUrgency(a: ChatAccount): "critical" | "high" | "medium" {
  const isCritical =
    (a.riskSignals >= 3 && a.sentiment === "negative") ||
    (a.riskSignals >= 3 && a.recentMeetings === 0 && a.openDeals === 0);
  if (isCritical) return "critical";

  const isHigh =
    a.riskSignals >= 3 ||
    a.sentiment === "negative" ||
    (a.recentMeetings === 0 && a.openDeals === 0);
  if (isHigh) return "high";

  return "medium";
}

function pickMessageType(a: ChatAccount): MessageType {
  if (a.status === "At risk") return "saveplay";
  if (a.status === "High expansion potential") return "expansion";
  return "checkin";
}

function companyDomain(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") + ".com"
  );
}

function contextLine(a: ChatAccount): string {
  const parts: string[] = [];
  if (a.recentMeetings === 0) parts.push("no meetings in 30d");
  if (a.sentiment === "negative") parts.push("negative sentiment");
  if (a.riskSignals > 0)
    parts.push(`${a.riskSignals} risk signal${a.riskSignals === 1 ? "" : "s"}`);
  if (parts.length === 0) {
    if (a.needSignals > 0)
      parts.push(`${a.needSignals} need signal${a.needSignals === 1 ? "" : "s"}`);
    else if (a.openDeals > 0)
      parts.push(`${a.openDeals} open deal${a.openDeals === 1 ? "" : "s"}`);
    else parts.push("low activity");
  }
  return parts.join(" · ");
}

function makeDraft(a: ChatAccount, type: MessageType, idx: number): Draft {
  const { subject, body } = buildOutreachMessage(
    {
      companyName: a.companyName,
      status: a.status,
      sentiment: a.sentiment,
      recentMeetings: a.recentMeetings,
      openDeals: a.openDeals,
      engagedContacts: a.engagedContacts,
      needSignals: a.needSignals,
      riskSignals: a.riskSignals,
      topOpportunity: a.topOpportunity,
      ownerName: a.ownerName,
      companyRevenue: a.companyRevenue,
    },
    type,
  );

  return {
    id: `${a.companyId}-${type}-${idx}`,
    companyId: a.companyId,
    companyName: a.companyName,
    ownerName: a.ownerName,
    to: `champion@${companyDomain(a.companyName)}`,
    subject,
    body,
    context: contextLine(a),
    type,
    urgency: getUrgency(a),
    growthScore: a.growthScore,
    companyRevenue: a.companyRevenue,
  };
}

export function generateDrafts(accounts: ChatAccount[]): Draft[] {
  const seen = new Set<string>();
  const drafts: Draft[] = [];

  function addDraft(a: ChatAccount, type: MessageType) {
    if (seen.has(a.companyId)) return;
    seen.add(a.companyId);
    drafts.push(makeDraft(a, type, drafts.length));
  }

  // At-risk accounts (ALL) → saveplay
  const atRisk = accounts.filter((a) => a.status === "At risk");
  for (const a of atRisk) addDraft(a, "saveplay");

  // High expansion (top 5 by growthScore) → expansion
  const highExpansion = [...accounts]
    .filter((a) => a.status === "High expansion potential")
    .sort((a, b) => b.growthScore - a.growthScore)
    .slice(0, 5);
  for (const a of highExpansion) addDraft(a, "expansion");

  // Needs follow-up (top 5 by growthScore) → checkin
  const needsFollowUp = [...accounts]
    .filter((a) => a.status === "Needs follow-up")
    .sort((a, b) => b.growthScore - a.growthScore)
    .slice(0, 5);
  for (const a of needsFollowUp) addDraft(a, "checkin");

  // Low activity + revenue > 0 (top 5 by companyRevenue) → checkin
  const lowActivity = [...accounts]
    .filter((a) => a.status === "Low activity" && (a.companyRevenue ?? 0) > 0)
    .sort((a, b) => (b.companyRevenue ?? 0) - (a.companyRevenue ?? 0))
    .slice(0, 5);
  for (const a of lowActivity) addDraft(a, "checkin");

  // Sort: critical first, then high, then medium
  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
  drafts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return drafts;
}
