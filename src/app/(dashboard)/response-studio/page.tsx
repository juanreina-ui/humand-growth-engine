import { getAccountsOverview, getAccountsSignals } from "@/lib/db/queries";
import { scoreAccountFromDetail } from "@/lib/growth/scoring";
import { getStatusLabel } from "@/lib/growth/status";
import type { ChatAccount } from "@/ui/AccountsChat";
import { generateDrafts } from "@/lib/ai/responseStudio";
import { ResponseStudio } from "@/ui/ResponseStudio";

export const dynamic = "force-dynamic";

export default async function ResponseStudioPage() {
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

  const drafts = generateDrafts(chatAccounts);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Response Studio</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          {drafts.length} personalised messages ready · review and send at your own pace
        </p>
      </div>
      <ResponseStudio initialDrafts={drafts} />
    </div>
  );
}
