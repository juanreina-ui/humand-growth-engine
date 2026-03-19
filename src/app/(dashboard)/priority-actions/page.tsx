import { getAccountsOverview, getAccountsSignals } from "@/lib/db/queries";
import { scoreAccountFromDetail } from "@/lib/growth/scoring";
import { getStatusLabel } from "@/lib/growth/status";
import { formatRevenue } from "@/lib/growth/format";
import { PriorityActionsView } from "@/ui/PriorityActionsView";
import type { ChatAccount } from "@/ui/AccountsChat";
import type { PriorityAccount } from "@/ui/AccountsPageActions";

export const dynamic = "force-dynamic";

export default async function PriorityActionsPage() {
  const { accounts } = await getAccountsOverview();
  const signals = await getAccountsSignals(accounts.map((a) => a.companyId));

  const rows = accounts.map((a) => {
    const detail = signals.byCompanyId.get(a.companyId) ?? {
      deals: [],
      meetings: [],
      contacts: [],
      transcriptInsights: [],
    };
    const scored = scoreAccountFromDetail(a, {
      ...detail,
      companySummary: a.companySummary,
      warnings: [],
    });
    const status = getStatusLabel(scored);
    return { ...a, scored, status };
  });

  const chatAccounts: ChatAccount[] = rows.map((r) => ({
    companyId: r.companyId,
    companyName: r.companyName,
    ownerName: r.ownerName ?? null,
    companySize: r.companySize ?? null,
    companyRevenue: r.companyRevenue ?? null,
    growthScore: r.scored.growthScore,
    status: r.status,
    recentMeetings: r.scored.recentMeetings,
    openDeals: r.scored.openDeals,
    engagedContacts: r.scored.engagedContacts,
    needSignals: r.scored.needSignals,
    riskSignals: r.scored.riskSignals,
    sentiment: r.scored.sentiment,
    topOpportunity: r.scored.topOpportunity,
  }));

  const priorityAccounts: PriorityAccount[] = chatAccounts
    .filter((a) => (a.companyRevenue ?? 0) > 0 && a.growthScore < 70)
    .map((a) => ({ ...a, priorityScore: (a.companyRevenue ?? 0) * (100 - a.growthScore) }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);

  const totalAtRisk = priorityAccounts.reduce(
    (s, a) => s + (a.companyRevenue ?? 0),
    0,
  );
  const count = priorityAccounts.length;

  const criticalCount = priorityAccounts.filter(
    (a) =>
      (a.riskSignals >= 3 && a.sentiment === "negative") ||
      (a.riskSignals >= 3 && a.recentMeetings === 0 && a.openDeals === 0),
  ).length;

  const avgScore =
    priorityAccounts.length > 0
      ? Math.round(
          priorityAccounts.reduce((s, a) => s + a.growthScore, 0) /
            priorityAccounts.length,
        )
      : 0;

  const heroStats = { totalAtRisk, count, criticalCount, avgScore };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Priority Actions</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          High-revenue accounts needing immediate attention
        </p>
      </div>

      {/* Hero stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Revenue at risk */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">
            Revenue at risk
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-rose-700">
            {formatRevenue(totalAtRisk)}
          </div>
          <div className="mt-1 text-xs text-rose-500">combined priority revenue</div>
        </div>

        {/* Accounts flagged */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
            Accounts flagged
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-amber-700">
            {count}
          </div>
          <div className="mt-1 text-xs text-amber-600">high-revenue, low engagement</div>
        </div>

        {/* Critical */}
        <div
          className={`rounded-2xl border px-5 py-4 ${
            criticalCount > 0
              ? "border-rose-200 bg-rose-50"
              : "border-zinc-200 bg-zinc-50"
          }`}
        >
          <div
            className={`text-[11px] font-semibold uppercase tracking-wide ${
              criticalCount > 0 ? "text-rose-500" : "text-zinc-500"
            }`}
          >
            Critical
          </div>
          <div
            className={`mt-2 text-2xl font-bold tabular-nums ${
              criticalCount > 0 ? "text-rose-700" : "text-zinc-700"
            }`}
          >
            {criticalCount}
          </div>
          <div
            className={`mt-1 text-xs ${
              criticalCount > 0 ? "text-rose-500" : "text-zinc-500"
            }`}
          >
            requiring immediate action
          </div>
        </div>

        {/* Avg score */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Avg score
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-zinc-700">
            {avgScore}
            <span className="text-sm font-normal text-zinc-400"> / 100</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">avg growth score of flagged</div>
        </div>
      </div>

      {/* Content */}
      {priorityAccounts.length === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-10 text-center">
          <div className="text-2xl">✅</div>
          <h2 className="mt-3 text-base font-semibold text-emerald-800">
            All high-revenue accounts have strong scores
          </h2>
          <p className="mt-1 text-sm text-emerald-700">
            No priority actions needed right now. Keep up the great work!
          </p>
        </div>
      ) : (
        <PriorityActionsView
          accounts={chatAccounts}
          priorityAccounts={priorityAccounts}
          heroStats={heroStats}
        />
      )}
    </div>
  );
}
