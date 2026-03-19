"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountsChat, type ChatAccount } from "@/ui/AccountsChat";
import { type PriorityAccount } from "@/ui/AccountsPageActions";
import { formatRevenue } from "@/lib/growth/format";

// ─── Urgency ──────────────────────────────────────────────────────────────────

function getUrgency(a: ChatAccount): "critical" | "high" | "medium" {
  const isCritical =
    (a.riskSignals >= 3 && a.sentiment === "negative") ||
    (a.riskSignals >= 3 && a.recentMeetings === 0 && a.openDeals === 0);
  const isHigh =
    a.riskSignals >= 3 ||
    a.sentiment === "negative" ||
    (a.recentMeetings === 0 && a.openDeals === 0);
  return isCritical ? "critical" : isHigh ? "high" : "medium";
}

// ─── Reason bullets ───────────────────────────────────────────────────────────

function buildReasonBullets(a: ChatAccount): string[] {
  const bullets: string[] = [];
  if (a.recentMeetings === 0)
    bullets.push("No meetings in the last 30 days — account has gone dark");
  if (a.sentiment === "negative")
    bullets.push("Negative sentiment in recent call transcripts — risk of churn");
  if (a.openDeals === 0)
    bullets.push("No active deals in pipeline — commercial momentum has stalled");
  if (a.riskSignals >= 3)
    bullets.push(`${a.riskSignals} risk signals detected across activity and transcripts`);
  if (a.engagedContacts <= 1)
    bullets.push(`Only ${a.engagedContacts} contact(s) active — key stakeholders going dark`);
  if (a.growthScore < 40)
    bullets.push(`Growth score ${a.growthScore} is critically low`);
  if (bullets.length === 0)
    bullets.push("Engagement declining — proactive outreach recommended");
  return bullets;
}

// ─── Detailed action ──────────────────────────────────────────────────────────

function buildDetailedAction(a: ChatAccount): string {
  if (a.sentiment === "negative" && a.recentMeetings === 0)
    return "Immediate escalation required. Send a personal email from the account owner within 24 hours acknowledging the issue, then book an emergency call with the main champion to present a resolution plan. Involve a senior stakeholder if there is no response within 48 hours.";
  if (a.riskSignals >= 3 && a.openDeals === 0)
    return "Trigger a save play immediately. Escalate to a senior stakeholder, propose a complimentary success review this week, and prepare a value-delivered summary. Offer a personalised roadmap session to re-engage the account and identify new commercial opportunities.";
  if (a.recentMeetings === 0 && a.sentiment !== "negative")
    return "Re-engagement sequence: send a personalised value recap email referencing their top use case, then propose a 20-min check-in call. If no response within 5 business days, escalate to a senior CSM or AE.";
  if (a.openDeals === 0 && a.recentMeetings >= 1)
    return "Convert existing meeting momentum into a deal. Prepare a scoped expansion proposal tied to their stated goals, present it in the next meeting, and agree on clear next steps. Set a follow-up within 7 days.";
  return "Schedule a QBR within the next two weeks. Review value delivered, surface expansion opportunities tied to their business goals, and confirm the renewal timeline. Use this meeting to position additional product areas.";
}

// ─── Recovery label ───────────────────────────────────────────────────────────

function recoveryLabel(a: PriorityAccount): string {
  const recoverableScore = 100 - a.growthScore;
  if (recoverableScore > 60) return "High recovery potential";
  if (recoverableScore > 30) return "Moderate recovery potential";
  return "Stable — early intervention";
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 55 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

// ─── Priority card ────────────────────────────────────────────────────────────

function PriorityCard({
  account,
  onAnalyze,
}: {
  account: PriorityAccount;
  onAnalyze: (query: string) => void;
}) {
  const urgency = getUrgency(account);
  const bullets = buildReasonBullets(account);
  const action = buildDetailedAction(account);
  const recovery = recoveryLabel(account);

  const urgencyBadge =
    urgency === "critical"
      ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
      : urgency === "high"
        ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
        : "bg-sky-100 text-sky-700 ring-1 ring-sky-200";

  const urgencyLabel =
    urgency === "critical" ? "CRITICAL" : urgency === "high" ? "HIGH" : "MEDIUM";

  const statusColor =
    account.status === "At risk"
      ? "bg-rose-100 text-rose-700"
      : account.status === "Low activity"
        ? "bg-zinc-100 text-zinc-600"
        : "bg-amber-100 text-amber-700";

  const sentimentIcon =
    account.sentiment === "positive"
      ? "🟢"
      : account.sentiment === "negative"
        ? "🔴"
        : "⚪";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${urgencyBadge}`}>
            {urgencyLabel}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>
            {account.status}
          </span>
        </div>
        <button
          onClick={() => onAnalyze(`Priority analysis: ${account.companyName}`)}
          className="rounded-xl bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-zinc-700"
        >
          Analyze with AI ✦
        </button>
      </div>

      {/* Company name + owner */}
      <div>
        <Link
          href={`/accounts/${encodeURIComponent(account.companyId)}`}
          className="text-base font-bold text-zinc-900 hover:underline"
        >
          {account.companyName}
        </Link>
        {account.ownerName && (
          <p className="mt-0.5 text-[11px] text-zinc-400">Owner: {account.ownerName}</p>
        )}
      </div>

      {/* Revenue + growth score */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
            Annual Revenue
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
            {formatRevenue(account.companyRevenue)}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            <span>Growth Score</span>
            <span className="font-bold text-zinc-700">{account.growthScore}/100</span>
          </div>
          <ScoreBar score={account.growthScore} />
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
          {account.recentMeetings} meetings
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
          {account.openDeals} deals
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
          {account.engagedContacts} contacts
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
          {sentimentIcon} sentiment
        </span>
      </div>

      {/* Why urgent */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
          Why urgent
        </p>
        <ul className="mt-1.5 space-y-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended action */}
      <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-sky-700">
          Recommended action
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-sky-900">{action}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Link
          href={`/accounts/${encodeURIComponent(account.companyId)}`}
          className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          View account →
        </Link>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-600">
          {recovery}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PriorityActionsView({
  accounts,
  priorityAccounts,
}: {
  accounts: ChatAccount[];
  priorityAccounts: PriorityAccount[];
  heroStats: {
    totalAtRisk: number;
    count: number;
    criticalCount: number;
    avgScore: number;
  };
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerQuery, setDrawerQuery] = useState<string | undefined>(undefined);

  function openWithQuery(query: string) {
    setDrawerQuery(query);
    setDrawerOpen(true);
  }

  function openDefault() {
    setDrawerQuery("Priority actions");
    setDrawerOpen(true);
  }

  return (
    <>
      {/* Get full AI briefing button */}
      <div className="flex justify-end">
        <button
          onClick={openDefault}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3l2 2" />
          </svg>
          Get full AI briefing
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {priorityAccounts.map((a) => (
          <PriorityCard key={a.companyId} account={a} onAnalyze={openWithQuery} />
        ))}
      </div>

      {/* Chat drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col shadow-2xl">
            <AccountsChat
              accounts={accounts}
              initialQuery={drawerQuery}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </>
      )}
    </>
  );
}
