import Link from "next/link";
import { getAccountsOverview, getAccountsSignals } from "@/lib/db/queries";
import { scoreAccountFromDetail } from "@/lib/growth/scoring";
import { getStatusLabel } from "@/lib/growth/status";
import { formatRevenue } from "@/lib/growth/format";
import type { ChatAccount } from "@/ui/AccountsChat";
import { Tooltip } from "@/ui/Tooltip";

export const dynamic = "force-dynamic";

const STAT_TOOLTIPS = {
  high: "Accounts with a growth score ≥ 75 and ≤ 1 risk signal. These are your best upsell candidates.",
  follow: "Accounts with a growth score ≥ 55 that haven't yet hit expansion threshold. Action required.",
  risk: "Accounts with 3 or more risk signals. Prioritise save plays to prevent churn.",
  low: "Accounts with low engagement and no urgent signals. Consider a re-engagement campaign.",
};

export default async function DashboardPage() {
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

  const statusCounts = rows.reduce(
    (acc, r) => {
      if (r.status === "High expansion potential") acc.high++;
      else if (r.status === "Needs follow-up") acc.follow++;
      else if (r.status === "At risk") acc.risk++;
      else acc.low++;
      return acc;
    },
    { high: 0, follow: 0, risk: 0, low: 0 },
  );

  const totalRevenue = rows.reduce((s, r) => s + (r.companyRevenue ?? 0), 0);
  const atRiskRevenue = rows
    .filter((r) => r.status === "At risk")
    .reduce((s, r) => s + (r.companyRevenue ?? 0), 0);
  const expansionRevenue = rows
    .filter((r) => r.status === "High expansion potential")
    .reduce((s, r) => s + (r.companyRevenue ?? 0), 0);

  const avgScore =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.scored.growthScore, 0) / rows.length)
      : 0;

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

  const priorityCount = chatAccounts.filter(
    (a) => (a.companyRevenue ?? 0) > 0 && a.growthScore < 70,
  ).length;

  const totalAtRisk = chatAccounts
    .filter((a) => (a.companyRevenue ?? 0) > 0 && a.growthScore < 70)
    .reduce((s, a) => s + (a.companyRevenue ?? 0), 0);

  const topExpansion = rows
    .filter((r) => r.status === "High expansion potential")
    .sort((a, b) => b.scored.growthScore - a.scored.growthScore)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          {rows.length} accounts · portfolio overview
        </p>
      </div>

      {/* Revenue tiles */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Total portfolio revenue
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-zinc-900">
            {formatRevenue(totalRevenue)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{rows.length} accounts</div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">
            Revenue at risk
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-rose-700">
            {formatRevenue(atRiskRevenue)}
          </div>
          <div className="mt-1 text-xs text-rose-500">
            {statusCounts.risk} at-risk account{statusCounts.risk === 1 ? "" : "s"}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
            Expansion potential
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-emerald-700">
            {formatRevenue(expansionRevenue)}
          </div>
          <div className="mt-1 text-xs text-emerald-600">
            {statusCounts.high} expansion-ready account{statusCounts.high === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Expansion-ready", value: statusCounts.high, color: "text-emerald-700 bg-emerald-50 border-emerald-100", href: "/accounts?filter=high-expansion", tip: STAT_TOOLTIPS.high },
          { label: "Needs follow-up", value: statusCounts.follow, color: "text-amber-700 bg-amber-50 border-amber-100", href: "/accounts?filter=needs-follow-up", tip: STAT_TOOLTIPS.follow },
          { label: "At risk", value: statusCounts.risk, color: "text-rose-700 bg-rose-50 border-rose-100", href: "/accounts", tip: STAT_TOOLTIPS.risk },
          { label: "Low activity", value: statusCounts.low, color: "text-zinc-600 bg-zinc-50 border-zinc-200", href: "/accounts", tip: STAT_TOOLTIPS.low },
        ].map((s) => (
          <Tooltip key={s.label} content={s.tip}>
            <Link href={s.href} className={`block w-full rounded-2xl border px-4 py-3 transition hover:opacity-80 ${s.color}`}>
              <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
              <div className="mt-0.5 text-xs font-medium">{s.label}</div>
            </Link>
          </Tooltip>
        ))}
      </div>

      {/* Average score bar */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-900">Portfolio health</div>
          <div className="text-sm font-bold tabular-nums text-zinc-700">{avgScore} / 100</div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-all ${
              avgScore >= 75 ? "bg-emerald-500" : avgScore >= 55 ? "bg-amber-400" : "bg-rose-400"
            }`}
            style={{ width: `${avgScore}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
          <span>Average growth score across all accounts</span>
          <span>
            {avgScore >= 75 ? "Strong" : avgScore >= 55 ? "Moderate" : "Needs attention"}
          </span>
        </div>
      </div>

      {/* Priority actions summary */}
      <Link
        href="/priority-actions"
        className="block rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 transition hover:bg-rose-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-rose-900">
              Revenue at risk — {formatRevenue(totalAtRisk)}
            </div>
            <div className="mt-0.5 text-xs text-rose-700">
              {priorityCount} high-revenue account{priorityCount === 1 ? "" : "s"} need immediate attention
            </div>
          </div>
          <div className="text-rose-600 text-sm font-medium">View priority actions →</div>
        </div>
      </Link>

      {/* Top expansion accounts */}
      {topExpansion.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Top expansion opportunities</h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Highest-scoring accounts ready for upsell conversations
              </p>
            </div>
            <Link
              href="/accounts?filter=high-expansion"
              className="text-xs font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {topExpansion.map((r) => (
              <Link
                key={r.companyId}
                href={`/accounts/${encodeURIComponent(r.companyId)}`}
                className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">{r.companyName}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-400">
                    {r.ownerName ? `Owner: ${r.ownerName}` : "Unassigned"}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {r.companyRevenue ? (
                    <span className="text-sm font-semibold tabular-nums text-emerald-700">
                      {formatRevenue(r.companyRevenue)}
                    </span>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${r.scored.growthScore}%` }}
                      />
                    </div>
                    <span className="w-7 text-right text-sm font-bold tabular-nums text-zinc-900">
                      {r.scored.growthScore}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
