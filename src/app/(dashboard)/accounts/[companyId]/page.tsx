import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAccountDetail,
  getAccountsOverviewById,
} from "@/lib/db/queries";
import { scoreAccountFromDetail } from "@/lib/growth/scoring";
import { getStatusLabel } from "@/lib/growth/status";
import { Badge } from "@/ui/Badge";
import {
  explainScore,
  featureGapAnalysis,
  nextBestAction,
  buildScoreInsight,
} from "@/lib/ai/growthAi";
import { AccountDetailTabs } from "@/ui/AccountDetailTabs";
import { formatRevenue } from "@/lib/growth/format";

export const dynamic = "force-dynamic";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  const base = await getAccountsOverviewById(companyId);
  if (!base) notFound();

  const detail = await getAccountDetail(companyId);
  const scored = scoreAccountFromDetail(base, detail);
  const statusLabel = getStatusLabel(scored);
  const scoreInsight = buildScoreInsight(scored, base.companyName);

  const statusColor =
    statusLabel === "High expansion potential"
      ? "success"
      : statusLabel === "Needs follow-up"
        ? "warning"
        : statusLabel === "At risk"
          ? "danger"
          : "neutral";

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        href="/accounts"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 3L5 8l5 5" />
        </svg>
        Back to Accounts
      </Link>

      {/* Hero */}
      <div className="rounded-2xl bg-zinc-900 px-6 py-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{base.companyName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge intent={statusColor}>{statusLabel}</Badge>
              {base.ownerName && (
                <span className="text-sm text-zinc-400">
                  Owner: <span className="text-zinc-200">{base.ownerName}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {base.companyRevenue && (
              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <div className="text-[11px] font-medium text-zinc-400">Annual Revenue</div>
                <div className="text-xl font-bold tabular-nums text-emerald-400">
                  {formatRevenue(base.companyRevenue)}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
              <span className="text-3xl font-bold tabular-nums text-white">
                {scored.growthScore}
              </span>
              <div className="text-left">
                <div className="text-[11px] font-medium text-zinc-400">Growth</div>
                <div className="text-[11px] text-zinc-500">/ 100</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm">
          <span className="text-zinc-400">
            <span className="font-semibold text-white">{scored.recentMeetings}</span>{" "}
            recent meetings
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">
            <span className="font-semibold text-white">{scored.openDeals}</span> open deals
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">
            <span className="font-semibold text-white">{scored.engagedContacts}</span>{" "}
            engaged contacts
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">
            <span className="font-semibold text-white">{scored.needSignals}</span> need signals
          </span>
        </div>
      </div>

      {/* Tabs */}
      <AccountDetailTabs
        companyName={base.companyName}
        companySummary={detail.companySummary}
        companyRevenue={base.companyRevenue}
        ownerName={base.ownerName}
        status={statusLabel}
        scored={{
          recentMeetings: scored.recentMeetings,
          openDeals: scored.openDeals,
          engagedContacts: scored.engagedContacts,
          needSignals: scored.needSignals,
          riskSignals: scored.riskSignals,
          sentiment: scored.sentiment,
          topOpportunity: scored.topOpportunity,
        }}
        insights={{
          headline: scoreInsight.headline,
          bullets: scoreInsight.bullets,
          recommendedExpansion: scoreInsight.recommendedExpansion,
          explanation: explainScore(scored),
          gaps: featureGapAnalysis(scored),
          nba: nextBestAction(scored),
        }}
        deals={detail.deals}
        meetings={detail.meetings}
        contacts={detail.contacts}
        transcriptInsights={detail.transcriptInsights}
      />
    </div>
  );
}
