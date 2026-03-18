"use client";

import { useState } from "react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { OutreachMessageGenerator } from "@/ui/OutreachMessageGenerator";

type Insights = {
  headline: string;
  bullets: string[];
  recommendedExpansion: string;
  explanation: string;
  gaps: string;
  nba: string;
};

type Deal = {
  id?: string;
  name?: string;
  stage?: string;
  status?: string;
  amount?: number;
  closeDate?: string;
};

type Meeting = {
  id?: string;
  title?: string;
  when?: string;
  ownerName?: string;
};

type Contact = {
  id?: string;
  name?: string;
  email?: string;
  title?: string;
  engagement?: string;
};

type Transcript = {
  id?: string;
  title?: string;
  summary: string;
  signals: string[];
};

type ScoredMetrics = {
  recentMeetings: number;
  openDeals: number;
  engagedContacts: number;
  needSignals: number;
};

type Props = {
  companyName: string;
  companySummary?: string;
  scored: ScoredMetrics;
  insights: Insights;
  deals: Deal[];
  meetings: Meeting[];
  contacts: Contact[];
  transcriptInsights: Transcript[];
};

type Tab = "insights" | "activity" | "contacts";

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "border-zinc-900 text-zinc-900"
          : "border-transparent text-zinc-500 hover:text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

function MetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className={`text-xl font-semibold tabular-nums ${color}`}>{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

export function AccountDetailTabs({
  companyName,
  companySummary,
  scored,
  insights,
  deals,
  meetings,
  contacts,
  transcriptInsights,
}: Props) {
  const [tab, setTab] = useState<Tab>("insights");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200">
        <TabBtn active={tab === "insights"} onClick={() => setTab("insights")}>
          AI Insights
        </TabBtn>
        <TabBtn active={tab === "activity"} onClick={() => setTab("activity")}>
          Activity{" "}
          <span className="ml-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
            {deals.length + meetings.length}
          </span>
        </TabBtn>
        <TabBtn active={tab === "contacts"} onClick={() => setTab("contacts")}>
          Contacts{" "}
          <span className="ml-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
            {contacts.length}
          </span>
        </TabBtn>
      </div>

      {/* ── AI Insights ── */}
      {tab === "insights" && (
        <div className="space-y-4">
          {/* Metrics strip */}
          <div className="grid grid-cols-4 gap-3">
            <MetricPill label="Recent meetings" value={scored.recentMeetings} color="text-emerald-600" />
            <MetricPill label="Open deals" value={scored.openDeals} color="text-sky-600" />
            <MetricPill label="Engaged contacts" value={scored.engagedContacts} color="text-amber-600" />
            <MetricPill label="Need signals" value={scored.needSignals} color="text-rose-500" />
          </div>

          {companySummary && (
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
              {companySummary}
            </div>
          )}

          {/* Main insight card */}
          <Card>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              AI Insight
            </div>
            <div className="mt-2 text-base font-semibold text-zinc-900">
              {insights.headline}
            </div>
            <ul className="mt-3 space-y-1.5">
              {insights.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                  {b.replace(/^•\s*/, "")}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
              {insights.recommendedExpansion}
            </div>
            <OutreachMessageGenerator
              companyName={companyName}
              headline={insights.headline}
              bullets={insights.bullets}
              recommendedExpansion={insights.recommendedExpansion}
            />
          </Card>

          {/* Next best action */}
          <Card>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Next best action
            </div>
            <div className="mt-2 text-sm text-zinc-800">{insights.nba}</div>
          </Card>

          {/* Explanation + gaps */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Score explanation
              </div>
              <div className="mt-2 text-sm text-zinc-700">{insights.explanation}</div>
            </Card>
            <Card>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Feature gap analysis
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                {insights.gaps}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Activity ── */}
      {tab === "activity" && (
        <div className="space-y-4">
          {/* Transcripts */}
          {transcriptInsights.length > 0 && (
            <Card>
              <div className="text-sm font-semibold text-zinc-900">
                Call transcripts
                <span className="ml-2 text-xs font-normal text-zinc-400">
                  {transcriptInsights.length} calls
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {transcriptInsights.slice(0, 5).map((t, idx) => (
                  <div
                    key={t.id ?? idx}
                    className="rounded-xl border border-zinc-100 bg-zinc-50 p-3"
                  >
                    <div className="text-xs font-semibold text-zinc-700">
                      {t.title ?? "Call / meeting"}
                    </div>
                    <div className="mt-1 line-clamp-3 text-xs text-zinc-500">{t.summary}</div>
                    {t.signals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.signals.slice(0, 6).map((s) => (
                          <Badge key={s} intent="neutral">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Deals table */}
          <Card>
            <div className="text-sm font-semibold text-zinc-900">Deals</div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Stage</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2">Close date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {deals.map((d, idx) => (
                    <tr key={d.id ?? idx}>
                      <td className="py-2 pr-4 font-medium text-zinc-900">{d.name ?? "Deal"}</td>
                      <td className="py-2 pr-4 text-zinc-600">{d.stage ?? d.status ?? "—"}</td>
                      <td className="py-2 pr-4 text-zinc-600">
                        {d.amount != null ? `$${d.amount.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-2 text-zinc-600">{d.closeDate ?? "—"}</td>
                    </tr>
                  ))}
                  {deals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-zinc-400">
                        No deals found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Meetings table */}
          <Card>
            <div className="text-sm font-semibold text-zinc-900">Meetings</div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Title</th>
                    <th className="pb-2">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {meetings.map((m, idx) => (
                    <tr key={m.id ?? idx}>
                      <td className="py-2 pr-4 text-zinc-500">{m.when ?? "—"}</td>
                      <td className="py-2 pr-4 font-medium text-zinc-900">{m.title ?? "Meeting"}</td>
                      <td className="py-2 text-zinc-600">{m.ownerName ?? "—"}</td>
                    </tr>
                  ))}
                  {meetings.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-zinc-400">
                        No meetings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Contacts ── */}
      {tab === "contacts" && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {contacts.map((c, idx) => {
            const name = c.name ?? "Contact";
            const initials = name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
              .toUpperCase();
            return (
              <div
                key={c.id ?? idx}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-zinc-50">
                  {initials}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-sm font-semibold text-zinc-900">{name}</div>
                  <div className="text-xs text-zinc-500">{c.title ?? "—"}</div>
                  <div className="text-xs text-zinc-400">{c.email ?? "—"}</div>
                  {c.engagement && (
                    <Badge intent="neutral">{c.engagement}</Badge>
                  )}
                </div>
              </div>
            );
          })}
          {contacts.length === 0 && (
            <div className="col-span-2 rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-400">
              No contacts found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
