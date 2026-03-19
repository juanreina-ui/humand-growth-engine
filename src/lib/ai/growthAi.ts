import type { ScoredAccount } from "@/lib/growth/scoring";

export type OutreachParams = {
  companyName: string;
  status: string;
  sentiment: string;
  recentMeetings: number;
  openDeals: number;
  engagedContacts: number;
  needSignals: number;
  riskSignals: number;
  topOpportunity: string;
  ownerName?: string | null;
  companyRevenue?: number | null;
};

export type MessageType = "expansion" | "checkin" | "saveplay";

export function buildOutreachMessage(
  p: OutreachParams,
  type: MessageType,
): { subject: string; body: string } {
  const {
    companyName,
    status,
    sentiment,
    recentMeetings,
    openDeals,
    engagedContacts,
    needSignals,
    riskSignals,
  } = p;

  const recentMtg = recentMeetings > 0;
  const hasDeals = openDeals > 0;
  const dormant = recentMeetings === 0 && engagedContacts <= 1;

  // ── Save play ──────────────────────────────────────────────────────────────
  if (type === "saveplay") {
    const isNeg = sentiment === "negative";
    const subject = isNeg
      ? `Let's make this right — ${companyName}`
      : `${companyName} — I'd like to reconnect`;

    const opening = isNeg
      ? `I wanted to reach out personally because I've noticed some friction in our recent interactions with ${companyName}, and I take that seriously. I'd like to hear directly from you about your experience and make sure we address it properly.`
      : riskSignals >= 3
        ? `I've been reviewing your account and noticed we haven't been as connected recently as I'd like${recentMeetings === 0 ? " — no meetings in the past 30 days" : ""}${openDeals === 0 ? ", no active deals in motion" : ""}. That's on us, and I want to fix it.`
        : `I wanted to check in personally to make sure we're still delivering the value your team expects from us.`;

    const middle = hasDeals
      ? `We have ${openDeals === 1 ? "an open deal" : `${openDeals} open deals`} together that I'd like to move forward. More importantly, I want to make sure the commercial conversation is grounded in real value for your team — not just a transaction.`
      : `I'd love to put together a value recap specific to ${companyName} — what you've accomplished, where there are gaps, and what a path forward looks like.`;

    const body = `Hi [Name],

${opening}

${middle}

Would you have 30 minutes this week for a direct conversation? I'll come prepared with specifics, and I genuinely want to hear your perspective — no sales pitch, just an honest discussion.

Looking forward to connecting.

Best,
[Your name]`;
    return { subject, body };
  }

  // ── Expansion ──────────────────────────────────────────────────────────────
  if (type === "expansion") {
    const subject = recentMtg
      ? `Building on our momentum — next steps for ${companyName}`
      : `An opportunity I've been thinking about for ${companyName}`;

    const opening = recentMtg
      ? `Following up on our recent ${recentMeetings === 1 ? "conversation" : `${recentMeetings} conversations`} — I've been reflecting on where ${companyName} is headed and wanted to share some ideas while the context is fresh.`
      : `I've been reviewing ${companyName}'s profile and see a clear opportunity I didn't want to sit on.`;

    const signalLine =
      needSignals > 0
        ? `Your team has shown interest in ${needSignals} specific area${needSignals > 1 ? "s" : ""} — and from what I can see, there's a direct path from where you are today to a more impactful deployment.`
        : engagedContacts > 3
          ? `With ${engagedContacts} people across your team already engaged, the foundation is solid — this is about taking the next step together.`
          : `The signals I'm seeing suggest your team is ready to get more out of what we offer, and I want to make that easy.`;

    const dealLine = hasDeals
      ? `We have ${openDeals === 1 ? "an active opportunity" : `${openDeals} active opportunities`} in motion — I'd like to make sure these convert into something that genuinely moves the needle for you.`
      : `I'd love to put together a focused expansion proposal — specific to your team's use case, not a generic pitch.`;

    const body = `Hi [Name],

${opening}

${signalLine}

${dealLine}

Could we find 20 minutes this week to walk through this together? I'll have something concrete prepared so we can make the best use of your time.

Best,
[Your name]`;
    return { subject, body };
  }

  // ── Check-in (default) ────────────────────────────────────────────────────
  const isLowActivity = status === "Low activity" || dormant;
  const subject = isLowActivity
    ? `Checking in on ${companyName}`
    : `Quick follow-up — ${companyName}`;

  const opening = isLowActivity
    ? `It's been a while since we've properly connected, and I wanted to reach out. I'd love to hear how things are going at ${companyName} and whether we're still delivering value for your team.`
    : recentMtg
      ? `Following up on our recent ${recentMeetings === 1 ? "conversation" : "conversations"} — I want to make sure we keep the momentum going.`
      : `I wanted to check in and make sure everything is on track for your team.`;

  const middle = hasDeals
    ? `We have ${openDeals === 1 ? "an open opportunity" : `${openDeals} open opportunities`} I'd like to progress — I want to make sure you have everything you need to feel confident moving forward.`
    : needSignals > 0
      ? `I've picked up some signals that your team may benefit from a closer look at a few specific features. Happy to walk you through them — no pressure, just want to make sure you're getting full value.`
      : `I'd love to do a quick value check-in: what's working, what isn't, and whether there are areas where we could be doing more for you.`;

  const body = `Hi [Name],

${opening}

${middle}

Would a 20-minute call work this week? Happy to fit around your schedule.

Best,
[Your name]`;
  return { subject, body };
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


