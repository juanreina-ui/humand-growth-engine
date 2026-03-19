"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import Link from "next/link";
import { formatRevenue } from "@/lib/growth/format";

export type ChatAccount = {
  companyId: string;
  companyName: string;
  ownerName: string | null;
  companySize: number | null;
  companyRevenue: number | null;
  growthScore: number;
  status: string;
  recentMeetings: number;
  openDeals: number;
  engagedContacts: number;
  needSignals: number;
  riskSignals: number;
  sentiment: string;
  topOpportunity: string;
};

type UserMessage = { role: "user"; text: string };
type AssistantMessage = {
  role: "assistant";
  text: string;
  accounts?: ChatAccount[];
};
type Message = UserMessage | AssistantMessage;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
}

function pct(n: number, total: number) {
  return total ? Math.round((n / total) * 100) : 0;
}

function findAccount(name: string, accounts: ChatAccount[]): ChatAccount | undefined {
  const n = name.toLowerCase().trim();
  return (
    accounts.find((a) => a.companyName.toLowerCase() === n) ??
    accounts.find((a) => a.companyName.toLowerCase().startsWith(n)) ??
    accounts.find((a) => a.companyName.toLowerCase().includes(n))
  );
}

function has(q: string, ...terms: string[]): boolean {
  return terms.some((t) => q.includes(t));
}

// ─── Query engine ─────────────────────────────────────────────────────────────

function analyzeQuery(
  query: string,
  accounts: ChatAccount[],
): { text: string; accounts?: ChatAccount[] } {
  const q = query.toLowerCase().trim().replace(/-/g, " "); // normalise hyphens

  const total = accounts.length;
  if (total === 0) return { text: "No accounts loaded yet." };

  // ── Priority analysis for a specific account (from Priority Actions cards) ─
  if (q.startsWith("priority analysis:")) {
    const name = q.replace("priority analysis:", "").trim();
    const a = findAccount(name, accounts);
    if (!a)
      return { text: `I couldn't find an account matching **"${name}"**. Check the spelling and try again.` };

    const isCritical =
      (a.riskSignals >= 3 && a.sentiment === "negative") ||
      (a.riskSignals >= 3 && a.recentMeetings === 0 && a.openDeals === 0);
    const isHigh =
      a.riskSignals >= 3 ||
      a.sentiment === "negative" ||
      (a.recentMeetings === 0 && a.openDeals === 0);
    const urgencyLabel = isCritical ? "🔴 CRITICAL" : isHigh ? "🟡 HIGH" : "🔵 MEDIUM";

    const issues: string[] = [];
    if (a.recentMeetings === 0)
      issues.push("No meetings in the last 30 days — account has gone dark");
    if (a.sentiment === "negative")
      issues.push("Negative sentiment detected in recent call transcripts — churn risk");
    if (a.openDeals === 0)
      issues.push("No active deals in pipeline — commercial momentum has stalled");
    if (a.riskSignals >= 3)
      issues.push(`${a.riskSignals} risk signals flagged across activity and transcripts`);
    if (a.engagedContacts <= 1)
      issues.push(`Only ${a.engagedContacts} contact(s) active — key stakeholders going dark`);
    if (a.growthScore < 40)
      issues.push(`Growth score of ${a.growthScore} is critically low`);
    if (issues.length === 0)
      issues.push("Engagement declining — proactive outreach recommended");

    let action: string;
    if (a.sentiment === "negative" && a.recentMeetings === 0)
      action =
        "Immediate escalation required. Send a personal email from the account owner within 24 hours acknowledging the issue, then book an emergency call with the main champion to present a resolution plan. Involve a senior stakeholder if there is no response within 48 hours.";
    else if (a.riskSignals >= 3 && a.openDeals === 0)
      action =
        "Trigger a save play immediately. Escalate to a senior stakeholder, propose a complimentary success review this week, and prepare a value-delivered summary. Offer a personalised roadmap session to re-engage the account.";
    else if (a.recentMeetings === 0)
      action =
        "Re-engagement sequence: send a personalised value recap email referencing their top use case, then propose a 20-min check-in call. If no response within 5 business days, escalate to a senior CSM or AE.";
    else if (a.openDeals === 0 && a.recentMeetings >= 1)
      action =
        "Convert existing meeting momentum into a deal. Prepare a scoped expansion proposal tied to their stated goals, present it in the next meeting, and agree on clear next steps with a follow-up within 7 days.";
    else
      action =
        "Schedule a QBR within the next two weeks. Review value delivered, surface expansion opportunities tied to their business goals, and confirm the renewal timeline.";

    const sentimentIcon =
      a.sentiment === "positive" ? "🟢" : a.sentiment === "negative" ? "🔴" : "⚪";

    return {
      text: `**Priority analysis: ${a.companyName}**\n\nUrgency: **${urgencyLabel}** · Score: **${a.growthScore} / 100** · Status: **${a.status}**\nAnnual revenue: **${formatRevenue(a.companyRevenue)}**${a.ownerName ? ` · Owner: **${a.ownerName}**` : ""}\n\n**Why this account needs attention:**\n${issues.map((i) => `- ${i}`).join("\n")}\n\n**Key metrics:**\n- Meetings (last 30d): **${a.recentMeetings}**\n- Open deals: **${a.openDeals}**\n- Engaged contacts: **${a.engagedContacts}**\n- Sentiment: ${sentimentIcon} **${a.sentiment}**\n- Need signals: **${a.needSignals}**\n\n**💡 Top opportunity:** ${a.topOpportunity}\n\n**Recommended action:**\n${action}`,
      accounts: [a],
    };
  }

  // ── Portfolio summary ─────────────────────────────────────────────────────
  if (
    has(q, "summary", "overview", "portfolio", "how many", "total", "breakdown", "all accounts", "give me a", "what does my", "state of")
  ) {
    const high = accounts.filter((a) => a.status === "High expansion potential");
    const fu = accounts.filter((a) => a.status === "Needs follow-up");
    const risk = accounts.filter((a) => a.status === "At risk");
    const low = accounts.filter((a) => a.status === "Low activity");
    const totalDeals = accounts.reduce((s, a) => s + a.openDeals, 0);
    const totalMeetings = accounts.reduce((s, a) => s + a.recentMeetings, 0);
    const avgScore = avg(accounts.map((a) => a.growthScore));
    const withDeals = accounts.filter((a) => a.openDeals > 0).length;
    const totalRevenue = accounts.reduce((s, a) => s + (a.companyRevenue ?? 0), 0);
    const atRiskRevenue = risk.reduce((s, a) => s + (a.companyRevenue ?? 0), 0);
    return {
      text: `**Portfolio overview — ${total} accounts**\n\nTotal portfolio revenue: **${formatRevenue(totalRevenue)}**\nAverage growth score: **${avgScore} / 100**\n\n- 🟢 High expansion potential: **${high.length}** (${pct(high.length, total)}%)\n- 🟡 Needs follow-up: **${fu.length}** (${pct(fu.length, total)}%)\n- 🔴 At risk: **${risk.length}** (${pct(risk.length, total)}%) · **${formatRevenue(atRiskRevenue)}** at risk\n- ⚪ Low activity: **${low.length}** (${pct(low.length, total)}%)\n\nOpen deals: **${totalDeals}** across ${withDeals} accounts\nRecent meetings (last 30 days): **${totalMeetings}**\n\n${risk.length > 0 ? `⚠️ **${risk.length} accounts need urgent attention** — trigger save plays before they churn.` : "✅ No accounts are currently at critical risk."}`,
    };
  }

  // ── High revenue, low engagement (priority actions) ──────────────────────
  if (
    has(q, "priority action", "revenue at risk", "high revenue low", "important client", "vip account", "big account", "biggest client", "most valuable", "high value low", "enterprise at risk", "neglected", "high paying", "paying the most", "largest customer", "top client", "key account")
  ) {
    const priority = accounts
      .filter((a) => (a.companyRevenue ?? 0) > 0 && a.growthScore < 65)
      .map((a) => ({ ...a, priorityScore: (a.companyRevenue ?? 0) * (100 - a.growthScore) }))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 10);

    if (priority.length === 0)
      return { text: "All high-revenue accounts have strong growth scores — no urgent priority actions needed right now." };

    const totalAtRisk = priority.reduce((s, a) => s + (a.companyRevenue ?? 0), 0);
    const topThree = priority.slice(0, 3).map((a) =>
      `- **${a.companyName}** — ${formatRevenue(a.companyRevenue)} · score ${a.growthScore} · ${a.status}`
    ).join("\n");

    return {
      text: `**${priority.length} high-revenue accounts need immediate attention**\n\n${formatRevenue(totalAtRisk)} in combined revenue is underperforming.\n\n🎯 **Top priority accounts:**\n${topThree}\n\nThese accounts have significant revenue but low engagement scores. A targeted outreach from their CSM this week could prevent churn and unlock expansion opportunities.`,
      accounts: priority,
    };
  }

  // ── Revenue queries ───────────────────────────────────────────────────────
  if (has(q, "revenue", "arr", "biggest", "largest account", "highest revenue", "most revenue", "top revenue", "enterprise", "biggest customer")) {
    const withRevenue = accounts.filter((a) => a.companyRevenue && a.companyRevenue > 0);
    if (withRevenue.length === 0)
      return { text: "No revenue data is available for your accounts yet." };

    const sorted = [...withRevenue].sort((a, b) => (b.companyRevenue ?? 0) - (a.companyRevenue ?? 0));
    const top = sorted.slice(0, 10);
    const totalRevenue = withRevenue.reduce((s, a) => s + (a.companyRevenue ?? 0), 0);
    const atRiskRevenue = accounts.filter((a) => a.status === "At risk").reduce((s, a) => s + (a.companyRevenue ?? 0), 0);
    const expansionRevenue = accounts.filter((a) => a.status === "High expansion potential").reduce((s, a) => s + (a.companyRevenue ?? 0), 0);

    return {
      text: `**Revenue overview — ${withRevenue.length} accounts with data**\n\nTotal portfolio revenue: **${formatRevenue(totalRevenue)}**\nAt-risk revenue: **${formatRevenue(atRiskRevenue)}** 🔴\nExpansion-ready revenue: **${formatRevenue(expansionRevenue)}** 🟢\n\n**Top 10 by annual revenue:**`,
      accounts: top,
    };
  }

  // ── Revenue above threshold ────────────────────────────────────────────────
  const revAbove = q.match(/revenue (?:above|over|greater than|more than|exceeding|>\s*)\s*\$?([\d,.]+)\s*(m|b|k|million|billion|thousand)?/i);
  if (revAbove) {
    const num = parseFloat(revAbove[1].replace(/,/g, ""));
    const unit = (revAbove[2] ?? "").toLowerCase();
    const threshold = unit === "b" || unit === "billion" ? num * 1e9 : unit === "m" || unit === "million" ? num * 1e6 : unit === "k" || unit === "thousand" ? num * 1e3 : num;
    const filtered = accounts.filter((a) => (a.companyRevenue ?? 0) > threshold).sort((a, b) => (b.companyRevenue ?? 0) - (a.companyRevenue ?? 0));
    return {
      text: `**${filtered.length} accounts** with revenue above **${formatRevenue(threshold)}**:`,
      accounts: filtered,
    };
  }

  // ── At risk / churn ───────────────────────────────────────────────────────
  if (has(q, "at risk", "churn", "danger", "losing", "cancel", "unhappy", "save play", "red flag", "critical", "urgent", "rescue")) {
    const atRisk = accounts
      .filter((a) => a.status === "At risk")
      .sort((a, b) => b.riskSignals - a.riskSignals);
    if (atRisk.length === 0)
      return { text: "✅ No accounts are currently flagged **At risk**. Your portfolio health looks good!" };
    const avgRisk = avg(atRisk.map((a) => a.growthScore));
    return {
      text: `**${atRisk.length} at-risk account${atRisk.length === 1 ? "" : "s"}** detected — average growth score **${avgRisk}**.\n\nEach has 3+ risk signals (no recent meetings, no open deals, negative sentiment). Trigger save plays immediately:\n- Send a personalised check-in from their owner\n- Escalate to a senior stakeholder\n- Offer a complimentary success review`,
      accounts: atRisk,
    };
  }

  // ── High expansion / upsell ───────────────────────────────────────────────
  if (
    has(q, "expansion", "upsell", "high potential", "best account", "top account", "opportunity", "grow", "expand", "upgrade", "where should i focus", "focus this", "priority", "priorit", "who should i call", "who to call")
  ) {
    const high = accounts
      .filter((a) => a.status === "High expansion potential")
      .sort((a, b) => b.growthScore - a.growthScore);
    if (high.length === 0)
      return {
        text: "No accounts currently qualify for **High expansion potential**. Consider running re-engagement campaigns to build momentum.",
      };
    const topThree = high.slice(0, 3).map((a) => `- **${a.companyName}** (score ${a.growthScore}) — ${a.topOpportunity}`).join("\n");
    return {
      text: `**${high.length} high-expansion account${high.length === 1 ? "" : "s"}** — average growth score **${avg(high.map((a) => a.growthScore))}**.\n\n🎯 **Top 3 to prioritise:**\n${topThree}\n\nThese accounts have strong engagement across meetings, deals, and contacts — ideal for upsell conversations.`,
      accounts: high,
    };
  }

  // ── Needs follow-up ───────────────────────────────────────────────────────
  if (
    has(q, "follow up", "follow-up", "needs attention", "action needed", "action required", "pending", "stalled", "stuck", "not progressing", "needs follow")
  ) {
    const fu = accounts
      .filter((a) => a.status === "Needs follow-up")
      .sort((a, b) => b.growthScore - a.growthScore);
    if (fu.length === 0)
      return { text: "No accounts are currently flagged for **Needs follow-up**." };
    const topThree = fu.slice(0, 3).map((a) => `- **${a.companyName}** (score ${a.growthScore})`).join("\n");
    return {
      text: `**${fu.length} account${fu.length === 1 ? "" : "s"}** need follow-up — promising signals present, but action is required to move them forward.\n\n📋 **Start with these:**\n${topThree}\n\nRecommended action: send a targeted check-in referencing their last meeting topic.`,
      accounts: fu,
    };
  }

  // ── Open deals / pipeline ─────────────────────────────────────────────────
  if (has(q, "open deal", "pipeline", "active deal", "in progress deal", "deal", "revenue", "commercial", "contract")) {
    const withDeals = accounts
      .filter((a) => a.openDeals > 0)
      .sort((a, b) => b.openDeals - a.openDeals);
    if (withDeals.length === 0)
      return { text: "No accounts with open deals found in the current view." };
    const total = withDeals.reduce((s, a) => s + a.openDeals, 0);
    return {
      text: `**${withDeals.length} accounts** have open deals — **${total} deal${total === 1 ? "" : "s"}** total in the active pipeline.\n\nAccounts with the most deals are shown first. Consider running a deal review to unblock stalled negotiations.`,
      accounts: withDeals,
    };
  }

  // ── Most active / most meetings ───────────────────────────────────────────
  if (
    has(q, "most meeting", "most active", "most engaged", "highest engagement", "active account", "recent meeting", "highest meeting", "top engagement", "who am i meeting")
  ) {
    const sorted = [...accounts]
      .sort((a, b) => b.recentMeetings - a.recentMeetings)
      .slice(0, 10);
    const totalMtg = sorted.reduce((s, a) => s + a.recentMeetings, 0);
    return {
      text: `**Most active accounts** ranked by meetings in the last 30 days — **${totalMtg} meetings** across the top 10.\n\nHigh meeting frequency is a strong leading indicator of expansion readiness.`,
      accounts: sorted,
    };
  }

  // ── Lowest activity / dormant ─────────────────────────────────────────────
  if (
    has(q, "low activity", "inactive", "no meeting", "dormant", "silent", "quiet", "not engaged", "re-engage", "reengage", "cold", "ghosting", "haven't heard", "no contact", "no response")
  ) {
    const inactive = accounts
      .filter((a) => a.recentMeetings === 0)
      .sort((a, b) => a.growthScore - b.growthScore)
      .slice(0, 10);
    if (inactive.length === 0)
      return { text: "All accounts have had at least one meeting in the last 30 days. Great coverage!" };
    return {
      text: `**${inactive.length} accounts** with zero meetings in the last 30 days.\n\n💤 These may need a re-engagement play — try a personalised value recap or a light-touch check-in email to warm them back up.`,
      accounts: inactive,
    };
  }

  // ── Highest / top growth scores ───────────────────────────────────────────
  if (
    has(q, "highest score", "best score", "top score", "ranking", "leaderboard", "top 10", "top ten", "strongest account", "healthiest")
  ) {
    const sorted = [...accounts].sort((a, b) => b.growthScore - a.growthScore).slice(0, 10);
    return {
      text: `**Top 10 accounts** ranked by growth score — average **${avg(sorted.map((a) => a.growthScore))}** across this cohort:`,
      accounts: sorted,
    };
  }

  // ── Lowest / worst scores ─────────────────────────────────────────────────
  if (has(q, "lowest score", "worst score", "bottom", "weakest", "unhealthy", "poor score", "low score")) {
    const sorted = [...accounts].sort((a, b) => a.growthScore - b.growthScore).slice(0, 10);
    return {
      text: `**Bottom 10 accounts** by growth score — average **${avg(sorted.map((a) => a.growthScore))}**. These may benefit from a re-activation campaign or a revised success plan.`,
      accounts: sorted,
    };
  }

  // ── Positive sentiment ────────────────────────────────────────────────────
  if (has(q, "positive sentiment", "happy customer", "satisfied", "loving it", "excited", "enthusiastic", "good sentiment", "great feedback")) {
    const pos = accounts
      .filter((a) => a.sentiment === "positive")
      .sort((a, b) => b.growthScore - a.growthScore);
    if (pos.length === 0) return { text: "No accounts with positive sentiment detected in recent transcripts." };
    return {
      text: `**${pos.length} accounts** with positive sentiment in recent call transcripts — these are warm and receptive. Great candidates for upsell conversations or case study requests.`,
      accounts: pos,
    };
  }

  // ── Negative sentiment ────────────────────────────────────────────────────
  if (has(q, "negative sentiment", "frustrated", "unhappy", "complain", "issue", "problem", "bug report", "bad feedback", "dissatisfied", "angry")) {
    const neg = accounts
      .filter((a) => a.sentiment === "negative")
      .sort((a, b) => b.riskSignals - a.riskSignals);
    if (neg.length === 0) return { text: "No accounts with negative sentiment detected. Transcripts look healthy." };
    return {
      text: `**${neg.length} accounts** showing negative sentiment in recent transcripts.\n\n⚠️ These accounts have expressed frustration or issues. Prioritise outreach from their CSM with a resolution plan within 48 hours.`,
      accounts: neg,
    };
  }

  // ── Filter by owner ───────────────────────────────────────────────────────
  const ownerMatch = q.match(
    /(?:owned by|assigned to|owner is|belonging to|managed by|(\w+(?:'s)?)\s+accounts?|accounts?\s+(?:for|of|from|by)\s+(.+))/,
  );
  const ownerSearch =
    ownerMatch?.[1]?.replace(/'s$/, "") ??
    ownerMatch?.[2]?.trim() ??
    (() => {
      const m = q.match(/show me (.+?)(?:'s)?\s+accounts?/);
      return m?.[1];
    })();

  if (ownerSearch && ownerSearch.length > 2) {
    const matches = accounts.filter((a) =>
      a.ownerName?.toLowerCase().includes(ownerSearch.toLowerCase()),
    );
    if (matches.length > 0) {
      const ownerName = matches[0].ownerName ?? ownerSearch;
      const high = matches.filter((a) => a.status === "High expansion potential").length;
      const risk = matches.filter((a) => a.status === "At risk").length;
      return {
        text: `**${ownerName}'s accounts — ${matches.length} total**\n\nAverage growth score: **${avg(matches.map((a) => a.growthScore))}**\n- High expansion: **${high}** | At risk: **${risk}**\n- Open deals: **${matches.reduce((s, a) => s + a.openDeals, 0)}**\n- Recent meetings: **${matches.reduce((s, a) => s + a.recentMeetings, 0)}**`,
        accounts: matches.sort((a, b) => b.growthScore - a.growthScore),
      };
    }
  }

  // ── Score above threshold ─────────────────────────────────────────────────
  const scoreAbove = q.match(/score (?:above|over|greater than|more than|higher than|>)\s*(\d+)/);
  if (scoreAbove) {
    const threshold = parseInt(scoreAbove[1]);
    const filtered = accounts.filter((a) => a.growthScore > threshold).sort((a, b) => b.growthScore - a.growthScore);
    return {
      text: `**${filtered.length} accounts** with a growth score above **${threshold}**:`,
      accounts: filtered,
    };
  }

  // ── Score below threshold ─────────────────────────────────────────────────
  const scoreBelow = q.match(/score (?:below|under|less than|lower than|<)\s*(\d+)/);
  if (scoreBelow) {
    const threshold = parseInt(scoreBelow[1]);
    const filtered = accounts.filter((a) => a.growthScore < threshold).sort((a, b) => a.growthScore - b.growthScore);
    return {
      text: `**${filtered.length} accounts** with a growth score below **${threshold}**:`,
      accounts: filtered,
    };
  }

  // ── Similar accounts ──────────────────────────────────────────────────────
  const similarMatch = q.match(
    /similar (?:to|as) (.+)|customers? (?:like|similar to) (.+)|like (.+)|accounts? (?:like|similar to) (.+)/,
  );
  if (similarMatch) {
    const name = (similarMatch[1] ?? similarMatch[2] ?? similarMatch[3] ?? similarMatch[4])?.trim();
    if (name) {
      const target = findAccount(name, accounts);
      if (!target)
        return {
          text: `I couldn't find an account named **"${name}"**. Try a partial name or check the spelling.`,
        };
      const similar = accounts
        .filter((a) => a.companyId !== target.companyId)
        .map((a) => ({ ...a, diff: Math.abs(a.growthScore - target.growthScore) }))
        .filter((a) => a.diff <= 15)
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 8);

      if (similar.length === 0)
        return {
          text: `Found **${target.companyName}** (score ${target.growthScore}, ${target.status}) but no accounts sit within ±15 score points. Widen your criteria by asking for accounts with a similar status.`,
        };

      const all = [target, ...similar];
      return {
        text: `Found **${similar.length} accounts** similar to **${target.companyName}** (score: ${target.growthScore}, ${target.status}).\n\n**Cohort averages:**\n- Growth score: ${avg(all.map((a) => a.growthScore))}\n- Recent meetings: ${avg(all.map((a) => a.recentMeetings))}\n- Open deals: ${avg(all.map((a) => a.openDeals))}\n- Engaged contacts: ${avg(all.map((a) => a.engagedContacts))}`,
        accounts: similar,
      };
    }
  }

  // ── Compare two accounts ──────────────────────────────────────────────────
  const compareMatch = q.match(/compare (.+?) (?:and|vs\.?|versus|with) (.+)/);
  if (compareMatch) {
    const [, raw1, raw2] = compareMatch;
    const a1 = findAccount(raw1.trim(), accounts);
    const a2 = findAccount(raw2.trim(), accounts);
    if (!a1 && !a2)
      return { text: `I couldn't find accounts matching **"${raw1}"** or **"${raw2}"**. Check the spelling.` };
    if (!a1) return { text: `I couldn't find an account matching **"${raw1}"**.` };
    if (!a2) return { text: `I couldn't find an account matching **"${raw2}"**.` };

    const row = (label: string, v1: number, v2: number, unit = "") => {
      const leader = v1 > v2 ? a1.companyName : v2 > v1 ? a2.companyName : null;
      return `- ${label}: **${v1}${unit}** vs **${v2}${unit}**${leader ? ` → ${leader} leads` : " (tied)"}`;
    };
    const sentimentRow = `- Sentiment: **${a1.sentiment}** vs **${a2.sentiment}**`;
    const winner = a1.growthScore > a2.growthScore ? a1 : a2;

    return {
      text: `**${a1.companyName} vs ${a2.companyName}**\n\n${row("Growth score", a1.growthScore, a2.growthScore)}\n${row("Recent meetings", a1.recentMeetings, a2.recentMeetings)}\n${row("Open deals", a1.openDeals, a2.openDeals)}\n${row("Engaged contacts", a1.engagedContacts, a2.engagedContacts)}\n${row("Need signals", a1.needSignals, a2.needSignals)}\n${sentimentRow}\n\n- ${a1.companyName} status: **${a1.status}**\n- ${a2.companyName} status: **${a2.status}**\n\n🏆 **${winner.companyName}** has the stronger growth profile overall.`,
      accounts: [a1, a2],
    };
  }

  // ── This week / what to do ────────────────────────────────────────────────
  if (has(q, "this week", "today", "what should i do", "where do i start", "action plan", "to do", "task", "recommend", "suggest", "advice", "what to do", "game plan")) {
    const atRisk = accounts.filter((a) => a.status === "At risk").slice(0, 3);
    const expansion = accounts.filter((a) => a.status === "High expansion potential").slice(0, 3);
    const followUp = accounts.filter((a) => a.status === "Needs follow-up").slice(0, 2);
    const combined = [...atRisk, ...expansion, ...followUp];
    return {
      text: `**Your action plan for this week:**\n\n🔴 **Save plays (${atRisk.length > 0 ? atRisk.map((a) => a.companyName).join(", ") : "none"}):**\nReach out within 48 hrs with a resolution plan.\n\n🟢 **Expansion plays (${expansion.length > 0 ? expansion.map((a) => a.companyName).join(", ") : "none"}):**\nBook a QBR or upsell discovery call.\n\n🟡 **Follow-up plays (${followUp.length > 0 ? followUp.map((a) => a.companyName).join(", ") : "none"}):**\nSend a personalised check-in email this week.`,
      accounts: combined.length > 0 ? combined : undefined,
    };
  }

  // ── Specific account lookup ───────────────────────────────────────────────
  const stripped = q
    .replace(/\b(show|find|search|get|tell me about|who is|what about|look up|details for|info on|information about|give me|pull up)\b/g, "")
    .trim();

  if (stripped.length >= 2) {
    const matches = accounts.filter((a) =>
      a.companyName.toLowerCase().includes(stripped),
    );
    if (matches.length === 1) {
      const a = matches[0];
      const sentimentIcon = a.sentiment === "positive" ? "🟢" : a.sentiment === "negative" ? "🔴" : "⚪";
      return {
        text: `**${a.companyName}**\n\nGrowth score: **${a.growthScore} / 100** · Status: **${a.status}**\n\n- Annual revenue: **${formatRevenue(a.companyRevenue)}**\n- Recent meetings (30d): **${a.recentMeetings}**\n- Open deals: **${a.openDeals}**\n- Engaged contacts: **${a.engagedContacts}**\n- Need signals: **${a.needSignals}**\n- Sentiment: ${sentimentIcon} **${a.sentiment}**\n${a.ownerName ? `- Owner: **${a.ownerName}**` : ""}\n\n💡 ${a.topOpportunity}`,
        accounts: [a],
      };
    }
    if (matches.length > 1 && matches.length <= 10) {
      return {
        text: `Found **${matches.length} accounts** matching "${stripped}":`,
        accounts: matches,
      };
    }
    if (matches.length > 10) {
      return {
        text: `Found **${matches.length} accounts** matching "${stripped}" — showing the top 10 by growth score:`,
        accounts: matches.sort((a, b) => b.growthScore - a.growthScore).slice(0, 10),
      };
    }
  }

  // ── Fallback with smart suggestions ──────────────────────────────────────
  return {
    text: `I didn't quite catch that. Here are things you can ask me:\n\n**Portfolio**\n- "Give me a portfolio summary"\n- "Action plan for this week"\n\n**By status**\n- "Show at risk accounts"\n- "High expansion opportunities"\n- "Which accounts need follow-up?"\n\n**Activity**\n- "Most active accounts"\n- "Accounts with no recent meetings"\n- "Open deals pipeline"\n\n**Scoring**\n- "Top 10 by growth score"\n- "Accounts with score above 70"\n\n**Specific**\n- "Find [company name]"\n- "Compare [A] vs [B]"\n- "Show Sarah Chen's accounts"`,
  };
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function RenderText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-0.5 text-[13px] leading-5">
      {lines.map((line, i) => {
        if (line === "") return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-semibold text-zinc-900">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <Fragment key={j}>{part}</Fragment>
          ),
        );
        return (
          <p key={i} className={line.startsWith("- ") ? "pl-2 text-zinc-600" : ""}>
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

// ─── Account card ─────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  "High expansion potential": "bg-emerald-100 text-emerald-800",
  "Needs follow-up": "bg-amber-100 text-amber-800",
  "At risk": "bg-rose-100 text-rose-800",
  "Low activity": "bg-zinc-100 text-zinc-700",
};

function AccountCard({ account }: { account: ChatAccount }) {
  return (
    <Link
      href={`/accounts/${encodeURIComponent(account.companyId)}`}
      className="group flex items-start justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm transition hover:border-zinc-300 hover:shadow"
    >
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-zinc-900 group-hover:text-zinc-700">
          {account.companyName}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-zinc-500">
          {account.companyRevenue ? (
            <span className="font-medium text-emerald-700">{formatRevenue(account.companyRevenue)}</span>
          ) : null}
          {account.companyRevenue ? <span>·</span> : null}
          <span>{account.recentMeetings} mtg</span>
          <span>{account.openDeals} deals</span>
          <span>{account.engagedContacts} contacts</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[12px] font-semibold tabular-nums text-zinc-900">
          {account.growthScore}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${statusColor[account.status] ?? "bg-zinc-100 text-zinc-700"}`}>
          {account.status}
        </span>
      </div>
    </Link>
  );
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Priority actions",
  "Portfolio summary",
  "Show at risk accounts",
  "High expansion opportunities",
  "Top accounts by revenue",
  "Action plan for this week",
];

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountsChat({
  accounts,
  onClose,
  initialQuery,
}: {
  accounts: ChatAccount[];
  onClose?: () => void;
  initialQuery?: string;
}) {
  const WELCOME: AssistantMessage = {
    role: "assistant",
    text: `Hi! I'm **Vejj**, your AI assistant. I can analyse your **${accounts.length} accounts** — find at-risk accounts, compare metrics, surface expansion opportunities, or build your action plan for this week.`,
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send the initial query once on mount
  useEffect(() => {
    if (initialQuery) {
      const q = initialQuery.trim();
      if (q) {
        const userMsg: UserMessage = { role: "user", text: q };
        const result = analyzeQuery(q, accounts);
        const assistantMsg: AssistantMessage = { role: "assistant", ...result };
        setMessages([WELCOME, userMsg, assistantMsg]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function newChat() {
    setMessages([{ ...WELCOME }]);
    setInput("");
  }

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    const userMsg: UserMessage = { role: "user", text: q };
    const result = analyzeQuery(q, accounts);
    const assistantMsg: AssistantMessage = { role: "assistant", ...result };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 bg-zinc-900 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
          <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" />
            <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-white">Vejj — AI Assistant</div>
          <div className="text-[10px] text-zinc-400">{accounts.length} accounts loaded</div>
        </div>
        <button
          onClick={newChat}
          title="New chat"
          className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          New chat
        </button>
        {onClose && (
          <button
            onClick={onClose}
            title="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" style={{ minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            {msg.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-zinc-900 px-3 py-2 text-[13px] text-white">
                {msg.text}
              </div>
            ) : (
              <div className="w-full">
                <div className="rounded-2xl rounded-tl-sm bg-zinc-50 px-3 py-2.5 text-zinc-700 ring-1 ring-zinc-100">
                  <RenderText text={msg.text} />
                </div>
                {msg.accounts && msg.accounts.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.accounts.map((a) => (
                      <AccountCard key={a.companyId} account={a} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-100 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
          <textarea
            className="flex-1 resize-none bg-transparent text-[13px] leading-5 text-zinc-900 placeholder-zinc-400 focus:outline-none"
            placeholder="Ask about your accounts…"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:opacity-40"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        </div>
        <div className="mt-1.5 text-center text-[10px] text-zinc-400">
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
