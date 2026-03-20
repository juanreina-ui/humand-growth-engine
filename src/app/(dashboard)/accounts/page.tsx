import Link from "next/link";
import { getAccountsOverview, getAccountsSignals } from "@/lib/db/queries";
import { scoreAccountFromDetail } from "@/lib/growth/scoring";
import { getStatusLabel } from "@/lib/growth/status";
import { Badge } from "@/ui/Badge";
import { formatCompactNumber, formatRevenue } from "@/lib/growth/format";
import { AccountsPageActions } from "@/ui/AccountsPageActions";
import type { ChatAccount } from "@/ui/AccountsChat";
import { Tooltip } from "@/ui/Tooltip";

export const revalidate = 300; // revalidate every 5 minutes

const SCORE_TOOLTIP =
  "Growth score (0–100) combines: recent meetings (up to 25 pts), open deals (up to 25 pts), engaged contacts (up to 20 pts), company size (up to 20 pts), and transcript need signals (up to 20 pts). Positive sentiment adds 6 pts; negative subtracts 6 pts.";

const STATUS_TOOLTIPS: Record<string, string> = {
  "High expansion potential":
    "Score ≥ 75 with ≤ 1 risk signal. Strong engagement across meetings, deals, and contacts — prime for upsell.",
  "Needs follow-up":
    "Score ≥ 55. Promising signals are present but action is required to progress the account.",
  "At risk":
    "3+ risk signals detected (e.g. no recent meetings, no open deals, or negative transcript sentiment). Prioritise a save play.",
  "Low activity":
    "Score < 55 with no urgent risk signals. Low engagement — consider a re-activation sequence.",
};

function StatusBadge({ label }: { label: string }) {
  const intent =
    label === "High expansion potential"
      ? "success"
      : label === "Needs follow-up"
        ? "warning"
        : label === "At risk"
          ? "danger"
          : "neutral";
  return (
    <Tooltip content={STATUS_TOOLTIPS[label] ?? label}>
      <Badge intent={intent}>{label}</Badge>
    </Tooltip>
  );
}

const STAT_TOOLTIPS = {
  high: "Accounts with a growth score ≥ 75 and ≤ 1 risk signal. These are your best upsell candidates.",
  follow: "Accounts with a growth score ≥ 55 that haven't yet hit expansion threshold. Action required.",
  risk: "Accounts with 3 or more risk signals. Prioritise save plays to prevent churn.",
  low: "Accounts with low engagement and no urgent signals. Consider a re-engagement campaign.",
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = typeof sp.filter === "string" ? sp.filter : undefined;

  const { accounts } = await getAccountsOverview();
  const signals = await getAccountsSignals(accounts.map((a) => a.companyId));

  const rows = accounts
    .map((a) => {
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
    })
    .filter((r) => {
      if (!filter) return true;
      if (filter === "needs-follow-up") return r.status === "Needs follow-up";
      if (filter === "high-expansion") return r.status === "High expansion potential";
      return true;
    })
    .sort((a, b) => b.scored.growthScore - a.scored.growthScore);

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

  const pageTitle =
    filter === "high-expansion"
      ? "High expansion"
      : filter === "needs-follow-up"
        ? "Needs follow-up"
        : "All accounts";

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{pageTitle}</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {rows.length} account{rows.length === 1 ? "" : "s"} · ranked by growth score
          </p>
        </div>
      </div>

      {/* Actions: Ask AI button + chat drawer */}
      <AccountsPageActions
        accounts={chatAccounts}
        priorityAccounts={[]}
        showPriority={false}
      />

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Expansion-ready", value: statusCounts.high, color: "text-emerald-700 bg-emerald-50 border-emerald-100", tip: STAT_TOOLTIPS.high },
          { label: "Needs follow-up", value: statusCounts.follow, color: "text-amber-700 bg-amber-50 border-amber-100", tip: STAT_TOOLTIPS.follow },
          { label: "At risk", value: statusCounts.risk, color: "text-rose-700 bg-rose-50 border-rose-100", tip: STAT_TOOLTIPS.risk },
          { label: "Low activity", value: statusCounts.low, color: "text-zinc-600 bg-zinc-50 border-zinc-200", tip: STAT_TOOLTIPS.low },
        ].map((s) => (
          <Tooltip key={s.label} content={s.tip}>
            <div className={`w-full rounded-2xl border px-4 py-3 ${s.color}`}>
              <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
              <div className="mt-0.5 text-xs font-medium">{s.label}</div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">
                <Tooltip content={SCORE_TOOLTIP}>
                  <span className="inline-flex items-center gap-1">
                    Score
                    <svg className="h-3 w-3 text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 7v1M8 10.5v.5" />
                    </svg>
                  </span>
                </Tooltip>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Top opportunity</th>
              <th className="px-4 py-3">Next action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.companyId} className="transition-colors hover:bg-zinc-50/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/accounts/${encodeURIComponent(r.companyId)}`}
                    className="font-semibold text-zinc-900 hover:underline"
                  >
                    {r.companyName}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
                    <Tooltip content="Meetings held in the last 30 days. Each recent meeting contributes up to 6 pts to the growth score.">
                      <span>{r.scored.recentMeetings} mtg</span>
                    </Tooltip>
                    <span>·</span>
                    <Tooltip content="Active commercial opportunities not yet closed, won, or lost. Each open deal contributes 8 pts.">
                      <span>{r.scored.openDeals} deals</span>
                    </Tooltip>
                    <span>·</span>
                    <Tooltip content="Contacts with recorded activity in the last 30 days. Contributes up to 20 pts when 8+ contacts are engaged.">
                      <span>{formatCompactNumber(r.scored.engagedContacts)} contacts</span>
                    </Tooltip>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold tabular-nums text-zinc-900">
                    {formatRevenue(r.companyRevenue)}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {r.ownerName ?? <span className="text-zinc-400">Unassigned</span>}
                </td>
                <td className="px-4 py-3">
                  <Tooltip content={SCORE_TOOLTIP}>
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-right text-sm font-semibold tabular-nums text-zinc-900">
                        {r.scored.growthScore}
                      </span>
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={`h-full rounded-full ${
                            r.scored.growthScore >= 75
                              ? "bg-emerald-500"
                              : r.scored.growthScore >= 55
                                ? "bg-amber-400"
                                : "bg-rose-400"
                          }`}
                          style={{ width: `${r.scored.growthScore}%` }}
                        />
                      </div>
                    </div>
                  </Tooltip>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={r.status} />
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-zinc-600">
                  {r.scored.topOpportunity}
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-zinc-600">
                  {r.scored.suggestedNextAction}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
