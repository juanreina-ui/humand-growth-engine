import type { ScoredAccount } from "@/lib/growth/scoring";

export function buildOutreachMessage({
  companyName,
  headline,
  bullets,
  recommendedExpansion,
}: {
  companyName: string;
  headline: string;
  bullets: string[];
  recommendedExpansion: string;
}): string {
  const bulletLines = bullets.map((b) => b.replace(/^•\s*/, "– ")).join("\n");
  return `Subject: Unlocking Growth Opportunities at ${companyName}

Hi [Name],

I've been reviewing ${companyName}'s recent activity and wanted to reach out. ${headline}

Here's what stands out from our data:
${bulletLines}

${recommendedExpansion}

I'd love to connect for a quick 20-minute call to explore how we can best support your team. Are you available this week?

Looking forward to hearing from you.

Best,
[Your name]`;
}

export function explainScore(s: ScoredAccount) {
  const parts: string[] = [];
  if (s.recentMeetings > 0) parts.push(`${s.recentMeetings} recent meeting(s) indicate active engagement`);
  if (s.openDeals > 0) parts.push(`${s.openDeals} open deal(s) suggest near-term commercial motion`);
  if (s.engagedContacts > 0) parts.push(`${s.engagedContacts} engaged contact(s) improve odds of consensus`);
  if (s.needSignals > 0) parts.push(`${s.needSignals} product need signal(s) surfaced in transcripts`);

  const sentimentNote =
    s.sentiment === "positive"
      ? "Tone in transcripts skews positive, which supports expansion timing."
      : s.sentiment === "negative"
        ? "Tone in transcripts skews negative, so fixing friction should come first."
        : "Transcript tone is neutral; push for explicit success criteria.";

  const lead = parts.length > 0 ? `${parts.join(", ")}.` : "Score is driven by company size and baseline activity.";
  return `${lead} ${sentimentNote}`;
}

export function featureGapAnalysis(s: ScoredAccount) {
  const bullets: string[] = [];

  if (s.needSignals >= 2) {
    bullets.push("Likely missing: a clear workflow/integration story to reduce manual effort.");
    bullets.push("Risk: stakeholders may see the product as ‘nice-to-have’ without an automation win.");
  } else if (s.openDeals > 0) {
    bullets.push("Likely missing: sharper ROI proof points and plan packaging for the target use case.");
    bullets.push("Risk: deal stalls if champion can’t justify cost vs alternatives.");
  } else {
    bullets.push("Likely missing: a concrete adoption path (templates, best practices, quick wins).");
    bullets.push("Risk: value stays implicit; usage plateaus and expansion never materializes.");
  }

  if (s.sentiment === "negative") {
    bullets.push("Address gaps first: reliability, clarity, or support responsiveness (based on transcript tone).");
  }

  return bullets.map((b) => `- ${b}`).join("\n");
}

export function nextBestAction(s: ScoredAccount) {
  if (s.sentiment === "negative") {
    return "Stabilize the relationship: confirm the top friction point, assign an owner, and agree on a 7-day remediation milestone (then revisit expansion).";
  }
  if (s.openDeals > 0) {
    return "Convert momentum: propose a mutual action plan that ties product milestones to a clear commercial decision date, then schedule a stakeholder alignment call.";
  }
  if (s.recentMeetings > 0) {
    return "Capitalize on engagement: run a focused enablement session and end with a pilot proposal that naturally expands seats/usage.";
  }
  return "Re-ignite activity: send a value recap, ask for success criteria, and schedule a 20-minute success review with the champion + one stakeholder.";
}

export function buildScoreInsight(s: ScoredAccount, companyName: string) {
  let headline: string;
  if (s.growthScore >= 75) {
    headline = `${companyName} shows strong expansion potential.`;
  } else if (s.growthScore >= 55) {
    headline = `${companyName} has promising signals but needs follow-up to unlock expansion.`;
  } else if (s.riskSignals >= 3) {
    headline = `${companyName} is at risk without a clear path to value.`;
  } else {
    headline = `${companyName} shows low recent activity and weak expansion signals.`;
  }

  const bullets: string[] = [];
  if (s.recentMeetings > 0) {
    bullets.push(`• ${s.recentMeetings} meeting${s.recentMeetings === 1 ? "" : "s"} in the last 30 days`);
  } else {
    bullets.push("• No meetings in the last 30 days");
  }
  if (s.engagedContacts > 0) {
    bullets.push(
      `• ${s.engagedContacts} engaged contact${s.engagedContacts === 1 ? "" : "s"} across the account`,
    );
  }
  if (s.openDeals > 0) {
    bullets.push(`• ${s.openDeals} open commercial motion${s.openDeals === 1 ? "" : "s"} in pipeline`);
  }
  if (s.needSignals > 0) {
    bullets.push(`• Transcript signals suggest ${s.needSignals} area${s.needSignals === 1 ? "" : "s"} of product need`);
  }

  const recommendedExpansion =
    s.needSignals > 0
      ? "Recommended expansion: prioritize modules that address surfaced workflow/integration and analytics gaps."
      : s.openDeals > 0
        ? "Recommended expansion: focus on packaging an upsell that maps cleanly to the active deal(s)."
        : "Recommended expansion: start with a small pilot (e.g. one team or use case) to create a concrete success story.";

  return {
    headline,
    bullets,
    recommendedExpansion,
  };
}


