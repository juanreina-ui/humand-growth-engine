"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountsChat, type ChatAccount } from "@/ui/AccountsChat";
import { formatRevenue } from "@/lib/growth/format";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriorityAccount = ChatAccount & {
  priorityScore: number;
};

// ─── Per-account AI reasoning ─────────────────────────────────────────────────

function buildReason(a: ChatAccount): string {
  const issues: string[] = [];
  if (a.recentMeetings === 0) issues.push("no meetings in the last 30 days");
  if (a.sentiment === "negative") issues.push("negative sentiment in recent calls");
  if (a.openDeals === 0) issues.push("no active deals in pipeline");
  if (a.riskSignals >= 3) issues.push(`${a.riskSignals} risk signals detected`);
  if (a.engagedContacts <= 1) issues.push("contacts going dark");
  if (issues.length === 0) issues.push("engagement score is declining");
  return issues.join(" · ");
}

function buildAction(a: ChatAccount): string {
  if (a.sentiment === "negative")
    return "Send a direct issue-resolution note from the account owner within 48 h and book a call to restore confidence.";
  if (a.recentMeetings === 0 && a.riskSignals >= 3)
    return "Trigger a save-play: escalate to a senior stakeholder and propose a complimentary success review this week.";
  if (a.openDeals === 0 && a.recentMeetings >= 1)
    return "Convert recent meeting momentum into a deal — propose a scoped expansion pilot with a clear business case.";
  if (a.recentMeetings === 0)
    return "Send a personalised value recap email and propose a 20-min check-in call to re-engage the champion.";
  return "Book a QBR, review value delivered, and surface expansion opportunities tied to their stated goals.";
}

function buildChatQuery(a: ChatAccount): string {
  return `Priority analysis: ${a.companyName}`;
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 55 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
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
  const reason = buildReason(account);
  const action = buildAction(account);

  const statusColor =
    account.status === "At risk"
      ? "bg-rose-100 text-rose-700"
      : account.status === "Low activity"
        ? "bg-zinc-100 text-zinc-600"
        : "bg-amber-100 text-amber-700";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/accounts/${encodeURIComponent(account.companyId)}`}
            className="truncate text-sm font-semibold text-zinc-900 hover:underline"
          >
            {account.companyName}
          </Link>
          {account.ownerName && (
            <p className="text-[11px] text-zinc-400">Owner: {account.ownerName}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>
          {account.status}
        </span>
      </div>

      {/* Revenue + score */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-bold tabular-nums text-emerald-700">
            {formatRevenue(account.companyRevenue)}
          </div>
          <div className="text-[11px] text-zinc-400">annual revenue</div>
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Growth score</span>
            <span className="font-semibold text-zinc-700">{account.growthScore} / 100</span>
          </div>
          <ScoreBar score={account.growthScore} />
        </div>
      </div>

      {/* AI-derived reason */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Why urgent</p>
        <p className="mt-0.5 text-xs text-amber-900">{reason}</p>
      </div>

      {/* Recommended action */}
      <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">Recommended action</p>
        <p className="mt-0.5 text-xs text-sky-900">{action}</p>
      </div>

      {/* CTA row */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/accounts/${encodeURIComponent(account.companyId)}`}
          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 text-center text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          View account →
        </Link>
        <button
          onClick={() => onAnalyze(buildChatQuery(account))}
          className="flex-1 rounded-xl bg-zinc-900 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
        >
          Analyze with AI ✦
        </button>
      </div>
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export function AccountsPageActions({
  accounts,
  priorityAccounts,
  showPriority,
}: {
  accounts: ChatAccount[];
  priorityAccounts: PriorityAccount[];
  showPriority: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerQuery, setDrawerQuery] = useState<string | undefined>(undefined);

  function openWithQuery(query: string) {
    setDrawerQuery(query);
    setDrawerOpen(true);
  }

  function openDefault() {
    setDrawerQuery(undefined);
    setDrawerOpen(true);
  }

  const askAiButton = (
    <button
      onClick={openDefault}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
    >
      <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" />
        <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none" />
      </svg>
      Ask Vejj
    </button>
  );

  return (
    <>
      {/* When no priority section, show Ask AI button aligned right */}
      {(!showPriority || priorityAccounts.length === 0) && (
        <div className="flex justify-end">{askAiButton}</div>
      )}

      {/* Priority section */}
      {showPriority && priorityAccounts.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50">
          {/* Section header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100">
                <svg className="h-3.5 w-3.5 text-rose-600" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2L1.5 13h13L8 2z" />
                  <path d="M8 7v3M8 11.5v.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Priority Actions — Revenue at Risk</h2>
                <p className="text-[11px] text-zinc-500">
                  High-revenue accounts with low engagement scores. Each needs attention now.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {askAiButton}
              <button
                onClick={() => openWithQuery("Priority actions")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
              >
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" />
                </svg>
                Full AI briefing
              </button>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {priorityAccounts.map((a) => (
              <PriorityCard key={a.companyId} account={a} onAnalyze={openWithQuery} />
            ))}
          </div>
        </div>
      )}

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
