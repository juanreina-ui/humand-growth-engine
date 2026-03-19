"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DEMO_ACTIONS,
  GOAL_LABELS,
  CHANNEL_LABELS,
  METRIC_LABELS,
  TRIGGER_LABELS,
  AUDIENCE_LABELS,
  buildActionReasoning,
  simulateExecution,
  duplicateAction,
  getRecommendedSetup,
  type GrowthAction,
  type ActionStatus,
} from "@/lib/demo/growthActions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_BADGE_DARK: Record<ActionStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-300",
  draft: "bg-white/10 text-zinc-300",
  paused: "bg-amber-500/20 text-amber-300",
};

const STATUS_BADGE_LIGHT: Record<ActionStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-zinc-100 text-zinc-600",
  paused: "bg-amber-100 text-amber-700",
};

const STATUS_LABEL: Record<ActionStatus, string> = {
  active: "Active",
  draft: "Draft",
  paused: "Paused",
};

export default function ActionDetailPage() {
  const params = useParams<{ actionId: string }>();
  const found = DEMO_ACTIONS.find((a) => a.id === params.actionId) ?? null;

  const [action, setAction] = useState<GrowthAction | null>(found);
  const [showDuplicateToast, setShowDuplicateToast] = useState(false);
  const [runningNow, setRunningNow] = useState(false);

  if (!action) {
    return (
      <div className="space-y-4">
        <Link
          href="/actions"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← Back to Actions
        </Link>
        <div className="rounded-2xl border border-zinc-100 bg-white p-10 text-center shadow-sm">
          <p className="text-zinc-500">Action not found.</p>
        </div>
      </div>
    );
  }

  const reasoning = buildActionReasoning(action);
  const recommended =
    action.status === "draft" ? getRecommendedSetup(action.goal) : null;

  function handleRunNow() {
    if (!action) return;
    setRunningNow(true);
    const entry = simulateExecution(action);
    const updatedOutcome = `${entry.outcome.sent} sent · ${entry.outcome.opened} opened · ${entry.outcome.converted} converted`;
    setAction((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lastRun: entry.date,
        lastOutcome: updatedOutcome,
        executionHistory: [entry, ...prev.executionHistory],
        metrics: {
          totalExecutions: prev.metrics.totalExecutions + 1,
          audienceReached:
            prev.metrics.audienceReached + entry.audienceCount,
          openRate:
            entry.outcome.sent > 0
              ? Math.round(
                  (entry.outcome.opened / entry.outcome.sent) * 100
                )
              : prev.metrics.openRate,
          clickRate:
            entry.outcome.sent > 0
              ? Math.round(
                  (entry.outcome.clicked / entry.outcome.sent) * 100
                )
              : prev.metrics.clickRate,
          conversionRate:
            entry.outcome.sent > 0
              ? Math.round(
                  (entry.outcome.converted / entry.outcome.sent) * 100
                )
              : prev.metrics.conversionRate,
        },
      };
    });
    setTimeout(() => setRunningNow(false), 800);
  }

  function handleDuplicate() {
    if (!action) return;
    duplicateAction(action, `action-${Date.now()}`);
    setShowDuplicateToast(true);
    setTimeout(() => setShowDuplicateToast(false), 3500);
  }

  function handleToggleStatus() {
    setAction((prev) => {
      if (!prev) return prev;
      const next: ActionStatus =
        prev.status === "active"
          ? "paused"
          : prev.status === "paused"
          ? "active"
          : prev.status;
      return { ...prev, status: next };
    });
  }

  const showPerformance = action.metrics.totalExecutions > 0;
  const showSampleMessage =
    action.channels.includes("ai_email") ||
    action.channels.includes("cx_outreach");

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/actions"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
      >
        ← Back to Actions
      </Link>

      {/* Hero card */}
      <div className="rounded-2xl bg-zinc-900 px-6 py-5 text-white">
        {/* Row 1: badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_DARK[action.status]}`}
          >
            {STATUS_LABEL[action.status]}
          </span>
          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
            {GOAL_LABELS[action.goal]}
          </span>
        </div>

        {/* Row 2: name */}
        <h1 className="mt-3 text-2xl font-semibold">{action.name}</h1>

        {/* Row 3: channel pills */}
        <div className="mt-2 flex flex-wrap gap-2">
          {action.channels.map((ch) => (
            <span
              key={ch}
              className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
            >
              {CHANNEL_LABELS[ch]}
            </span>
          ))}
        </div>

        {/* Row 4: stats */}
        <div className="mt-4 flex flex-wrap gap-6 border-t border-white/10 pt-4 text-sm">
          <div>
            <div className="text-lg font-bold">
              {action.metrics.totalExecutions}
            </div>
            <div className="text-xs text-zinc-400">Executions</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {action.metrics.audienceReached}
            </div>
            <div className="text-xs text-zinc-400">Audience Reached</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {action.metrics.openRate}%
            </div>
            <div className="text-xs text-zinc-400">Open Rate</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {action.metrics.conversionRate}%
            </div>
            <div className="text-xs text-zinc-400">Conversion Rate</div>
          </div>
        </div>
      </div>

      {/* Three-column grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Col 1 — Configuration */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900">
            Configuration
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Trigger
              </div>
              <div className="mt-0.5 text-zinc-800">
                {TRIGGER_LABELS[action.triggerType]} (threshold:{" "}
                {action.triggerThreshold})
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                {action.triggerDescription}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Audience
              </div>
              <div className="mt-0.5 text-zinc-800">
                {AUDIENCE_LABELS[action.audienceType]}
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                {action.audienceDescription}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Success Metric
              </div>
              <div className="mt-0.5 text-zinc-800">
                {METRIC_LABELS[action.successMetric]}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Created
              </div>
              <div className="mt-0.5 text-zinc-800">
                {formatDate(action.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Col 2 — AI Reasoning */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-emerald-900">
            Why this action exists
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Why
              </div>
              <p className="text-emerald-900">{reasoning.why}</p>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Signal pattern
              </div>
              <p className="text-emerald-900">{reasoning.signal}</p>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Channel choice
              </div>
              <p className="text-emerald-900">{reasoning.channel}</p>
            </div>
          </div>
        </div>

        {/* Col 3 — Execution Guardrails */}
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-sky-900">
            What the AI can do
          </h3>
          <ul className="space-y-1.5 text-sm text-sky-900">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-sky-500">✓</span>
              Send up to {action.guardrails.maxSendsPerWeek} emails per contact
              per week
            </li>
            {action.guardrails.workingHoursOnly && (
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-sky-500">✓</span>
                Runs during working hours only
              </li>
            )}
            {action.guardrails.excludeRecentlyContacted && (
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-sky-500">✓</span>
                Skips recently-contacted accounts
              </li>
            )}
            {action.guardrails.approvalRequired && (
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-sky-500">✓</span>
                Requires human approval before sending
              </li>
            )}
          </ul>
          <div className="my-4 border-t border-sky-200" />
          <h4 className="mb-3 text-sm font-semibold text-sky-900">
            What it cannot do
          </h4>
          <ul className="space-y-1.5 text-sm text-sky-700">
            {[
              "Access external systems or APIs",
              "Send messages without matching guardrails",
              "Override manually excluded contacts",
              "Modify CRM records",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-sky-400">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Recommended Setup (draft only) */}
      {action.status === "draft" && recommended && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-amber-900">
            AI Recommended Setup
          </h3>
          <div className="space-y-3">
            {(
              [
                ["Trigger", recommended.trigger],
                ["Audience", recommended.audience],
                ["Channel", recommended.channel],
                ["Tone", recommended.tone],
                ["Follow-up interval", recommended.followUpInterval],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex gap-4 text-sm">
                <span className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wide text-amber-600">
                  {label}
                </span>
                <span className="text-amber-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance metrics */}
      {showPerformance && (
        <div className="grid grid-cols-5 gap-3">
          {(
            [
              ["Total executions", action.metrics.totalExecutions, ""],
              ["Audience reached", action.metrics.audienceReached, ""],
              ["Open rate", action.metrics.openRate, "%"],
              ["Click rate", action.metrics.clickRate, "%"],
              ["Conversion rate", action.metrics.conversionRate, "%"],
            ] as [string, number, string][]
          ).map(([label, value, suffix]) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm text-center"
            >
              <div className="text-xl font-bold text-zinc-900">
                {value}
                {suffix}
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sample generated message */}
      {showSampleMessage && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900">
            Sample Generated Message
          </h3>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <div className="mb-3 text-sm">
              <span className="font-semibold text-zinc-700">Subject: </span>
              <span className="font-semibold text-zinc-900">
                {action.sampleMessage.subject}
              </span>
            </div>
            <div className="border-t border-zinc-200 pt-3">
              <p className="whitespace-pre-wrap font-sans text-sm text-zinc-700">
                {action.sampleMessage.body}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls row */}
      <div className="flex flex-wrap gap-3">
        {action.status === "active" && (
          <button
            onClick={handleToggleStatus}
            className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
          >
            Pause Action
          </button>
        )}
        {action.status === "paused" && (
          <button
            onClick={handleToggleStatus}
            className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            Resume Action
          </button>
        )}
        <button
          onClick={handleRunNow}
          disabled={runningNow}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition-colors"
        >
          {runningNow ? "Running..." : "Run Now"}
        </button>
        <button
          onClick={handleDuplicate}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Duplicate
        </button>
      </div>

      {/* Duplicate toast */}
      {showDuplicateToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-zinc-900 px-5 py-3 text-sm text-white shadow-lg">
          Action duplicated — find it in your actions list.
        </div>
      )}

      {/* Execution history */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-base font-bold text-zinc-900">
            Execution History
          </h2>
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
            {action.executionHistory.length}
          </span>
        </div>

        {action.executionHistory.length === 0 ? (
          <div className="rounded-2xl border border-zinc-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-zinc-400">
              No executions yet. Run this action to see history here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {action.executionHistory.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
              >
                {/* Row 1: date + trigger */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-900">
                    {formatDate(entry.date)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    Triggered by: {entry.triggerDescription}
                  </span>
                </div>

                {/* Row 2: audience + action performed */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                    {entry.audienceCount} contacts
                  </span>
                  <span className="text-sm text-zinc-700">
                    {entry.actionPerformed}
                  </span>
                </div>

                {/* Row 3: outcome pills */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    Sent {entry.outcome.sent}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                    Opened {entry.outcome.opened}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Clicked {entry.outcome.clicked}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    Converted {entry.outcome.converted}
                  </span>
                </div>

                {/* Row 4: message snippet */}
                <p className="mt-2 truncate text-sm italic text-zinc-500">
                  &ldquo;{entry.messageSnippet}&rdquo;
                </p>

                {/* Row 5: AI note */}
                {entry.aiNote && (
                  <p className="mt-1.5 text-xs text-zinc-500">
                    🤖 {entry.aiNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
