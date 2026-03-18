"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import Link from "next/link";

export type ChatAccount = {
  companyId: string;
  companyName: string;
  ownerName: string | null;
  companySize: number | null;
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

// ─── query engine ────────────────────────────────────────────────────────────

function findAccount(name: string, accounts: ChatAccount[]): ChatAccount | undefined {
  const n = name.toLowerCase().trim();
  return (
    accounts.find((a) => a.companyName.toLowerCase() === n) ??
    accounts.find((a) => a.companyName.toLowerCase().includes(n))
  );
}

function avg(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
}

function analyzeQuery(
  query: string,
  accounts: ChatAccount[],
): { text: string; accounts?: ChatAccount[] } {
  const q = query.toLowerCase().trim();

  // ── Similar accounts ──────────────────────────────────────────────────────
  const similarMatch = q.match(
    /similar (?:to|as) (.+)|customers? (?:like|similar to) (.+)|like (.+)/,
  );
  if (similarMatch) {
    const name = (similarMatch[1] ?? similarMatch[2] ?? similarMatch[3])?.trim();
    if (name) {
      const target = findAccount(name, accounts);
      if (!target)
        return {
          text: `I couldn't find an account named **"${name}"**. Try a partial name or check the spelling.`,
        };
      const similar = accounts
        .filter((a) => a.companyId !== target.companyId)
        .map((a) => ({ ...a, diff: Math.abs(a.growthScore - target.growthScore) }))
        .filter((a) => a.diff <= 20)
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 6);

      if (similar.length === 0)
        return {
          text: `Found **${target.companyName}** (score: ${target.growthScore}, ${target.status}) but no other accounts sit within ±20 growth-score points.`,
        };

      const all = [target, ...similar];
      return {
        text: `Found **${similar.length} accounts** similar to **${target.companyName}** (score: ${target.growthScore}).\n\n**Cohort averages:**\n- Growth score: ${avg(all.map((a) => a.growthScore))}\n- Recent meetings: ${avg(all.map((a) => a.recentMeetings))}\n- Open deals: ${avg(all.map((a) => a.openDeals))}\n- Engaged contacts: ${avg(all.map((a) => a.engagedContacts))}`,
        accounts: similar,
      };
    }
  }

  // ── Compare two accounts ──────────────────────────────────────────────────
  const compareMatch = q.match(/compare (.+?) (?:and|vs\.?|versus) (.+)/);
  if (compareMatch) {
    const [, raw1, raw2] = compareMatch;
    const a1 = findAccount(raw1.trim(), accounts);
    const a2 = findAccount(raw2.trim(), accounts);
    if (!a1 && !a2)
      return { text: `I couldn't find accounts matching **"${raw1}"** or **"${raw2}"**.` };
    if (!a1) return { text: `I couldn't find an account matching **"${raw1}"**.` };
    if (!a2) return { text: `I couldn't find an account matching **"${raw2}"**.` };

    const row = (label: string, v1: number, v2: number) => {
      const leader = v1 > v2 ? a1.companyName : v2 > v1 ? a2.companyName : null;
      return `- ${label}: **${a1.companyName}** ${v1} vs **${a2.companyName}** ${v2}${leader ? ` → ${leader} leads` : " (tie)"}`;
    };

    return {
      text: `**${a1.companyName} vs ${a2.companyName}**\n\n${row("Growth score", a1.growthScore, a2.growthScore)}\n${row("Recent meetings", a1.recentMeetings, a2.recentMeetings)}\n${row("Open deals", a1.openDeals, a2.openDeals)}\n${row("Engaged contacts", a1.engagedContacts, a2.engagedContacts)}\n${row("Need signals", a1.needSignals, a2.needSignals)}\n\n- ${a1.companyName} status: ${a1.status}\n- ${a2.companyName} status: ${a2.status}`,
      accounts: [a1, a2],
    };
  }

  // ── At risk ───────────────────────────────────────────────────────────────
  if (q.includes("at risk") || q.includes("churn") || q.includes("danger")) {
    const atRisk = accounts
      .filter((a) => a.status === "At risk")
      .sort((a, b) => b.riskSignals - a.riskSignals);
    if (atRisk.length === 0)
      return { text: "No accounts are currently flagged **At risk**. Great news!" };
    return {
      text: `**${atRisk.length} at-risk account${atRisk.length === 1 ? "" : "s"}** — each has 3+ risk signals. Consider triggering save plays immediately.`,
      accounts: atRisk,
    };
  }

  // ── High expansion ────────────────────────────────────────────────────────
  if (
    q.includes("expansion") ||
    q.includes("upsell") ||
    q.includes("high potential") ||
    q.includes("best accounts") ||
    q.includes("top accounts")
  ) {
    const high = accounts
      .filter((a) => a.status === "High expansion potential")
      .sort((a, b) => b.growthScore - a.growthScore);
    if (high.length === 0)
      return { text: "No accounts currently qualify for **High expansion potential**." };
    return {
      text: `**${high.length} high-expansion account${high.length === 1 ? "" : "s"}** — average growth score **${avg(high.map((a) => a.growthScore))}**. These are your best upsell candidates.`,
      accounts: high,
    };
  }

  // ── Needs follow-up ───────────────────────────────────────────────────────
  if (
    q.includes("follow-up") ||
    q.includes("follow up") ||
    q.includes("needs attention") ||
    q.includes("action needed")
  ) {
    const fu = accounts
      .filter((a) => a.status === "Needs follow-up")
      .sort((a, b) => b.growthScore - a.growthScore);
    if (fu.length === 0) return { text: "No accounts currently flagged for **follow-up**." };
    return {
      text: `**${fu.length} account${fu.length === 1 ? "" : "s"}** need follow-up — promising signals, but action is required to move them forward.`,
      accounts: fu,
    };
  }

  // ── Open deals / pipeline ─────────────────────────────────────────────────
  if (q.includes("open deal") || q.includes("pipeline") || q.includes("active deal")) {
    const withDeals = accounts
      .filter((a) => a.openDeals > 0)
      .sort((a, b) => b.openDeals - a.openDeals);
    if (withDeals.length === 0) return { text: "No accounts with open deals found." };
    const total = withDeals.reduce((s, a) => s + a.openDeals, 0);
    return {
      text: `**${withDeals.length} accounts** with open deals — **${total} deals** total in the pipeline.`,
      accounts: withDeals,
    };
  }

  // ── Most active / most meetings ───────────────────────────────────────────
  if (
    q.includes("most meetings") ||
    q.includes("most active") ||
    q.includes("most engaged") ||
    q.includes("highest engagement")
  ) {
    const sorted = [...accounts]
      .sort((a, b) => b.recentMeetings - a.recentMeetings)
      .slice(0, 8);
    return {
      text: `**Most active accounts** ranked by recent meetings (last 30 days):`,
      accounts: sorted,
    };
  }

  // ── Highest score / ranking ───────────────────────────────────────────────
  if (
    q.includes("highest score") ||
    q.includes("best score") ||
    q.includes("top score") ||
    q.includes("ranking") ||
    q.includes("leaderboard")
  ) {
    const sorted = [...accounts].sort((a, b) => b.growthScore - a.growthScore).slice(0, 8);
    return {
      text: `**Top accounts** ranked by growth score:`,
      accounts: sorted,
    };
  }

  // ── Low activity ──────────────────────────────────────────────────────────
  if (
    q.includes("low activity") ||
    q.includes("inactive") ||
    q.includes("no meetings") ||
    q.includes("dormant")
  ) {
    const inactive = accounts
      .filter((a) => a.recentMeetings === 0 || a.status === "Low activity")
      .sort((a, b) => a.growthScore - b.growthScore)
      .slice(0, 8);
    return {
      text: `**${inactive.length} accounts** with low or zero recent activity. These may need a re-engagement play.`,
      accounts: inactive,
    };
  }

  // ── Portfolio summary ─────────────────────────────────────────────────────
  if (
    q.includes("how many") ||
    q.includes("summary") ||
    q.includes("overview") ||
    q.includes("total") ||
    q.includes("portfolio")
  ) {
    const statusGroups = accounts.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const lines = Object.entries(statusGroups)
      .sort((a, b) => b[1] - a[1])
      .map(([s, n]) => `- ${s}: **${n}**`)
      .join("\n");
    const totalDeals = accounts.reduce((s, a) => s + a.openDeals, 0);
    const totalMeetings = accounts.reduce((s, a) => s + a.recentMeetings, 0);
    return {
      text: `**Portfolio overview** — ${accounts.length} accounts\n\nAverage growth score: **${avg(accounts.map((a) => a.growthScore))}**\n\n${lines}\n\nTotal open deals: **${totalDeals}**\nTotal recent meetings: **${totalMeetings}**`,
    };
  }

  // ── Search by name ────────────────────────────────────────────────────────
  const cleaned = q
    .replace(/\b(show|find|search|get|tell me about|who is|what about)\b/g, "")
    .trim();
  if (cleaned.length >= 2) {
    const matches = accounts.filter((a) =>
      a.companyName.toLowerCase().includes(cleaned),
    );
    if (matches.length === 1) {
      const a = matches[0];
      return {
        text: `**${a.companyName}** — growth score **${a.growthScore}**, status: ${a.status}\n- Recent meetings: ${a.recentMeetings}\n- Open deals: ${a.openDeals}\n- Engaged contacts: ${a.engagedContacts}\n- Need signals: ${a.needSignals}\n- Sentiment: ${a.sentiment}`,
        accounts: [a],
      };
    }
    if (matches.length > 1 && matches.length <= 8) {
      return {
        text: `Found **${matches.length} accounts** matching "${cleaned}":`,
        accounts: matches,
      };
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return {
    text: `I can analyse your account data. Try asking:\n- **"Find accounts similar to [name]"**\n- **"Compare [A] vs [B]"**\n- **"Show at-risk accounts"**\n- **"High expansion opportunities"**\n- **"Accounts with open deals"**\n- **"Most active accounts"**\n- **"Portfolio summary"**`,
  };
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function RenderText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-[13px] leading-5">
      {lines.map((line, i) => {
        // render **bold** inline
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
          <p key={i} className={line.startsWith("- ") ? "pl-3" : ""}>
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
          <span>{account.recentMeetings} mtg</span>
          <span>{account.openDeals} deals</span>
          <span>{account.engagedContacts} contacts</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[12px] font-semibold tabular-nums text-zinc-900">
          {account.growthScore}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${statusColor[account.status] ?? "bg-zinc-100 text-zinc-700"}`}
        >
          {account.status}
        </span>
      </div>
    </Link>
  );
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Portfolio summary",
  "High expansion opportunities",
  "Show at-risk accounts",
  "Accounts with open deals",
  "Most active accounts",
];

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountsChat({ accounts, onClose }: { accounts: ChatAccount[]; onClose?: () => void }) {
  const WELCOME: AssistantMessage = {
    role: "assistant",
    text: `Hi! I can analyse your **${accounts.length} accounts**. Ask me anything — find similar customers, compare metrics, or surface risks and opportunities.`,
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function newChat() {
    setMessages([{ ...WELCOME }]);
    setInput("");
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          <svg
            className="h-3.5 w-3.5 text-emerald-400"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3l2 2" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-white">Account Intelligence</div>
          <div className="text-[10px] text-zinc-400">Ask questions about your accounts</div>
        </div>
        <button
          onClick={newChat}
          title="New chat"
          className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 260px)", minHeight: 320 }}>
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

      {/* Suggestions (only shown before first user message) */}
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
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
