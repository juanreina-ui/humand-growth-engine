import type { TranscriptInsight } from "@/lib/db/queries";
import type { ScoredAccount } from "@/lib/growth/scoring";

function summarizeSignals(s: ScoredAccount) {
  const bits: string[] = [];
  if (s.recentMeetings > 0) bits.push(`${s.recentMeetings} recent meeting(s)`);
  if (s.openDeals > 0) bits.push(`${s.openDeals} open deal(s)`);
  if (s.engagedContacts > 0) bits.push(`${s.engagedContacts} engaged contact(s)`);
  if (s.needSignals > 0) bits.push(`${s.needSignals} need signal(s) in transcripts`);
  return bits.length ? bits.join(", ") : "baseline account activity";
}

function pullTranscriptHook(transcripts: TranscriptInsight[]) {
  const t = transcripts[0];
  if (!t) return undefined;
  const firstSentence = t.summary.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  return firstSentence.length > 20 ? firstSentence : t.summary.slice(0, 180);
}

export function generateOutreach({
  kind,
  companyName,
  ownerName,
  scored,
  transcriptInsights,
}: {
  kind: "email" | "internal_note";
  companyName: string;
  ownerName?: string;
  scored: ScoredAccount;
  transcriptInsights: TranscriptInsight[];
}) {
  const signalLine = summarizeSignals(scored);
  const hook = pullTranscriptHook(transcriptInsights);

  if (kind === "internal_note") {
    return [
      `Internal success note — ${companyName}`,
      ``,
      `Signals: ${signalLine}.`,
      scored.sentiment === "negative"
        ? `Risk: transcript tone suggests friction; prioritize resolution before expansion.`
        : `Upsell angle: tie next milestone to a small expansion/pilot.`,
      ``,
      `Top opportunity: ${scored.topOpportunity}`,
      `Next action: ${scored.suggestedNextAction}`,
      hook ? `` : "",
      hook ? `Transcript hook: “${hook}”` : "",
    ]
      .filter((l) => l !== "")
      .join("\n");
  }

  const greeting = `Hi ${companyName} team,`;
  const signOff = ownerName ? `\n\nBest,\n${ownerName}` : `\n\nBest,\nCustomer Success`;

  const opener =
    scored.sentiment === "negative"
      ? `I wanted to follow up quickly — I heard a couple of friction points recently, and I want to make sure we’re unblocking you fast.`
      : `Thanks again for the recent touchpoint — I wanted to keep the momentum going and make the next step very clear.`;

  const hookLine = hook
    ? `One thing I noted: “${hook}”`
    : `From our recent signals, we’re seeing: ${signalLine}.`;

  const ask =
    scored.sentiment === "negative"
      ? `Could we do a 15-minute check-in this week to confirm the top issue and the success criteria for the fix?`
      : scored.openDeals > 0
        ? `Would you be open to a 20-minute alignment to confirm decision criteria and a simple mutual action plan?`
        : `Can we schedule a 20-minute success review to confirm your next milestone and the fastest path to it?`;

  const value =
    scored.needSignals > 0
      ? `If helpful, I can also share a quick example of how teams use our ${"workflow/integration"} approach to get a “first win” within a week.`
      : `If helpful, I can share a brief benchmark + a suggested 30-day success plan.`;

  return `${greeting}\n\n${opener}\n\n${hookLine}\n\n${ask}\n\n${value}${signOff}`;
}

