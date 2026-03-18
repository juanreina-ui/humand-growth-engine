import Link from "next/link";
import { getAccountsOverview, getAccountsSignals } from "@/lib/db/queries";
import { scoreAccountFromDetail } from "@/lib/growth/scoring";
import { getStatusLabel } from "@/lib/growth/status";
import { Badge } from "@/ui/Badge";
import { formatCompactNumber } from "@/lib/growth/format";
import { AccountsChatDrawer, type ChatAccount } from "@/ui/AccountsChatDrawer";

export const dynamic = "force-dynamic";

function StatusBadge({ label }: { label: string }) {
  const intent =
    label === "High expansion potential"
      ? "success"
      : label === "Needs follow-up"
        ? "warning"
        : label === "At risk"
          ? "danger"
          : "neutral";
  return <Badge intent={intent}>{label}</Badge>;
}

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
        <AccountsChatDrawer accounts={chatAccounts} />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Expansion-ready", value: statusCounts.high, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
          { label: "Needs follow-up", value: statusCounts.follow, color: "text-amber-700 bg-amber-50 border-amber-100" },
          { label: "At risk", value: statusCounts.risk, color: "text-rose-700 bg-rose-50 border-rose-100" },
          { label: "Low activity", value: statusCounts.low, color: "text-zinc-600 bg-zinc-50 border-zinc-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border px-4 py-3 ${s.color}`}>
            <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-xs font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Score</th>
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
                    <span>{r.scored.recentMeetings} mtg</span>
                    <span>·</span>
                    <span>{r.scored.openDeals} deals</span>
                    <span>·</span>
                    <span>{formatCompactNumber(r.scored.engagedContacts)} contacts</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {r.ownerName ?? <span className="text-zinc-400">Unassigned</span>}
                </td>
                <td className="px-4 py-3">
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
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
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
