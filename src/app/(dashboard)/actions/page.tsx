"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DEMO_ACTIONS,
  GOAL_LABELS,
  CHANNEL_LABELS,
  METRIC_LABELS,
  AUDIENCE_LABELS,
  TRIGGER_LABELS,
  getRecommendedSetup,
  type GrowthAction,
  type ActionStatus,
  type ActionGoal,
  type TriggerType,
  type AudienceType,
  type ActionChannelType,
  type SuccessMetric,
  type Guardrails,
} from "@/lib/demo/growthActions";

const STATUS_BADGE: Record<
  ActionStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700",
  },
  draft: {
    label: "Draft",
    className: "bg-zinc-100 text-zinc-600",
  },
  paused: {
    label: "Paused",
    className: "bg-amber-100 text-amber-700",
  },
};

const STATUS_BORDER: Record<ActionStatus, string> = {
  active: "border-l-4 border-l-emerald-400",
  draft: "border-l-4 border-l-zinc-300",
  paused: "border-l-4 border-l-amber-400",
};

const DEFAULT_GUARDRAILS: Guardrails = {
  maxSendsPerWeek: 2,
  workingHoursOnly: true,
  excludeRecentlyContacted: true,
  approvalRequired: false,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getExecutionsThisWeek(actions: GrowthAction[]): number {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return actions.reduce((sum, a) => {
    return (
      sum +
      a.executionHistory.filter(
        (e) => new Date(e.date) >= oneWeekAgo
      ).length
    );
  }, 0);
}

function getAvgConversion(actions: GrowthAction[]): number {
  const active = actions.filter((a) => a.status === "active");
  if (active.length === 0) return 0;
  const total = active.reduce((sum, a) => sum + a.metrics.conversionRate, 0);
  return Math.round(total / active.length);
}

// ─── Create modal step indicator ──────────────────────────────────────────────

function StepIndicator({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const labels = ["Basics", "Trigger & Audience", "Action & Guardrails", "AI Recommended Setup"];
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
              i + 1 === step
                ? "bg-zinc-900 text-white"
                : i + 1 < step
                ? "bg-emerald-500 text-white"
                : "bg-zinc-100 text-zinc-400"
            }`}
          >
            {i + 1 < step ? "✓" : i + 1}
          </div>
          <span
            className={`hidden text-xs sm:block ${
              i + 1 === step
                ? "font-semibold text-zinc-900"
                : i + 1 < step
                ? "text-emerald-600"
                : "text-zinc-400"
            }`}
          >
            {labels[i]}
          </span>
          {i < total - 1 && (
            <div
              className={`h-px w-4 ${
                i + 1 < step ? "bg-emerald-400" : "bg-zinc-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActionsPage() {
  const [actions, setActions] = useState<GrowthAction[]>(DEMO_ACTIONS);
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  // Form state
  const [formName, setFormName] = useState("");
  const [formGoal, setFormGoal] = useState<ActionGoal>("reduce_churn");
  const [formTriggerType, setFormTriggerType] =
    useState<TriggerType>("inactivity");
  const [formTriggerThreshold, setFormTriggerThreshold] = useState(14);
  const [formAudienceType, setFormAudienceType] =
    useState<AudienceType>("inactive_admins");
  const [formChannels, setFormChannels] = useState<ActionChannelType[]>([
    "ai_email",
  ]);
  const [formGuardrails, setFormGuardrails] =
    useState<Guardrails>(DEFAULT_GUARDRAILS);
  const [formSuccessMetric, setFormSuccessMetric] =
    useState<SuccessMetric>("return_login_rate");

  function resetForm() {
    setFormName("");
    setFormGoal("reduce_churn");
    setFormTriggerType("inactivity");
    setFormTriggerThreshold(14);
    setFormAudienceType("inactive_admins");
    setFormChannels(["ai_email"]);
    setFormGuardrails(DEFAULT_GUARDRAILS);
    setFormSuccessMetric("return_login_rate");
    setCreateStep(1);
  }

  function handleCloseModal() {
    setShowCreate(false);
    resetForm();
  }

  function toggleChannel(ch: ActionChannelType) {
    setFormChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  function handleConfirmCreate() {
    const newId = `action-${Date.now()}`;
    const triggerDescMap: Record<TriggerType, string> = {
      inactivity: `No admin login in ${formTriggerThreshold} days`,
      low_adoption: `Adoption below ${formTriggerThreshold}%`,
      high_engagement_missing_module: `High engagement but missing module usage in ${formTriggerThreshold} days`,
      high_commercial_intent: `Growth score ≥ ${formTriggerThreshold} with repeated engagement signals`,
    };
    const audienceDescMap: Record<AudienceType, string> = {
      new_admins: "New admins in their first 30 days",
      inactive_admins: `Admins with no session in the last ${formTriggerThreshold} days`,
      high_potential: "High-potential accounts with growth score ≥ 65",
      specific_segment: "Specific segment defined by CX team",
    };
    const newAction: GrowthAction = {
      id: newId,
      name: formName || "Untitled Action",
      status: "draft",
      goal: formGoal,
      triggerType: formTriggerType,
      triggerThreshold: formTriggerThreshold,
      triggerDescription: triggerDescMap[formTriggerType],
      audienceType: formAudienceType,
      audienceDescription: audienceDescMap[formAudienceType],
      channels: formChannels.length > 0 ? formChannels : ["ai_email"],
      guardrails: formGuardrails,
      successMetric: formSuccessMetric,
      createdAt: new Date().toISOString(),
      lastRun: null,
      lastOutcome: null,
      metrics: {
        totalExecutions: 0,
        audienceReached: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
      },
      executionHistory: [],
      sampleMessage: { subject: "", body: "" },
    };
    setActions((prev) => [...prev, newAction]);
    handleCloseModal();
  }

  const activeCount = actions.filter((a) => a.status === "active").length;
  const draftCount = actions.filter((a) => a.status === "draft").length;
  const execsThisWeek = getExecutionsThisWeek(actions);
  const avgConversion = getAvgConversion(actions);

  const recommended =
    createStep === 4 ? getRecommendedSetup(formGoal) : null;

  const ALL_CHANNELS: ActionChannelType[] = [
    "ai_email",
    "in_app_prompt",
    "cx_outreach",
    "reminder_sequence",
  ];

  const ALL_GOALS: ActionGoal[] = [
    "reduce_churn",
    "increase_activation",
    "increase_feature_adoption",
    "increase_expansion",
  ];

  const ALL_TRIGGERS: TriggerType[] = [
    "inactivity",
    "low_adoption",
    "high_engagement_missing_module",
    "high_commercial_intent",
  ];

  const ALL_AUDIENCES: AudienceType[] = [
    "new_admins",
    "inactive_admins",
    "high_potential",
    "specific_segment",
  ];

  const ALL_METRICS: SuccessMetric[] = [
    "return_login_rate",
    "feature_activation_rate",
    "open_rate",
    "expansion_conversion",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Autonomous Growth Actions
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure signal-triggered automations that run on your behalf —
            reviewed, guardrailed, and measurable.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          Create Action
        </button>
      </div>

      {/* Trust note */}
      <p className="text-xs text-zinc-500">
        <span className="mr-1">⚡</span>
        Signals combine live CRM data with AI-simulated enrichment where direct
        relationships are unavailable in the demo dataset.
      </p>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">
            {activeCount}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">Active Actions</div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-zinc-500">{draftCount}</div>
          <div className="mt-0.5 text-xs text-zinc-500">Draft Actions</div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">
            {execsThisWeek}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            Executions this week
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-sky-600">
            {avgConversion}%
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">Avg conversion</div>
        </div>
      </div>

      {/* Actions list */}
      <div className="space-y-3">
        {actions.map((action) => {
          const badge = STATUS_BADGE[action.status];
          const borderClass = STATUS_BORDER[action.status];
          return (
            <div
              key={action.id}
              className={`rounded-2xl border border-zinc-200 bg-white shadow-sm ${borderClass} overflow-hidden`}
            >
              <div className="p-5">
                {/* Row 1: badges + last run */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                      {GOAL_LABELS[action.goal]}
                    </span>
                    {action.channels.map((ch) => (
                      <span
                        key={ch}
                        className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700"
                      >
                        {CHANNEL_LABELS[ch]}
                      </span>
                    ))}
                  </div>
                  {action.lastRun && (
                    <span className="text-xs text-zinc-400">
                      Last run {formatDate(action.lastRun)}
                    </span>
                  )}
                </div>

                {/* Row 2: name */}
                <h2 className="mt-3 text-base font-bold text-zinc-900">
                  {action.name}
                </h2>

                {/* Row 3: trigger + audience */}
                <p className="mt-1 text-xs text-zinc-500">
                  {action.triggerDescription} · {action.audienceDescription}
                </p>

                {/* Row 4: metrics */}
                {action.metrics.totalExecutions > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600">
                    <span>
                      <span className="font-semibold text-zinc-800">
                        {action.metrics.totalExecutions}
                      </span>{" "}
                      Executions
                    </span>
                    <span>·</span>
                    <span>
                      Audience reached{" "}
                      <span className="font-semibold text-zinc-800">
                        {action.metrics.audienceReached}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Open{" "}
                      <span className="font-semibold text-zinc-800">
                        {action.metrics.openRate}%
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Click{" "}
                      <span className="font-semibold text-zinc-800">
                        {action.metrics.clickRate}%
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Conversion{" "}
                      <span className="font-semibold text-zinc-800">
                        {action.metrics.conversionRate}%
                      </span>
                    </span>
                  </div>
                )}

                {/* Row 5: last outcome */}
                {action.lastOutcome && (
                  <p className="mt-2 text-sm italic text-zinc-600">
                    {action.lastOutcome}
                  </p>
                )}

                {/* Row 6: link */}
                <div className="mt-4">
                  <Link
                    href={`/actions/${action.id}`}
                    className="text-sm font-medium text-zinc-900 hover:text-zinc-600"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Action Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-10 backdrop-blur-sm">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  Create Growth Action
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Step {createStep} of 4
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Step indicator */}
            <div className="border-b border-zinc-100 px-6 py-4">
              <StepIndicator step={createStep} total={4} />
            </div>

            {/* Step content */}
            <div className="px-6 py-6">
              {/* Step 1 — Basics */}
              {createStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Action name
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Recover inactive admins"
                      className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-zinc-800">
                      Goal
                    </label>
                    <div className="space-y-2">
                      {ALL_GOALS.map((g) => (
                        <label
                          key={g}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                            formGoal === g
                              ? "border-zinc-900 bg-zinc-50"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="goal"
                            value={g}
                            checked={formGoal === g}
                            onChange={() => setFormGoal(g)}
                            className="accent-zinc-900"
                          />
                          <span className="text-sm text-zinc-800">
                            {GOAL_LABELS[g]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 — Trigger & Audience */}
              {createStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Trigger type
                    </label>
                    <select
                      value={formTriggerType}
                      onChange={(e) =>
                        setFormTriggerType(e.target.value as TriggerType)
                      }
                      className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                    >
                      {ALL_TRIGGERS.map((t) => (
                        <option key={t} value={t}>
                          {TRIGGER_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Threshold
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={formTriggerThreshold}
                        onChange={(e) =>
                          setFormTriggerThreshold(Number(e.target.value))
                        }
                        className="w-28 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                      />
                      <span className="text-sm text-zinc-500">
                        {formTriggerType === "low_adoption"
                          ? "% adoption"
                          : formTriggerType === "high_commercial_intent"
                          ? "growth score"
                          : "days"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Audience
                    </label>
                    <select
                      value={formAudienceType}
                      onChange={(e) =>
                        setFormAudienceType(e.target.value as AudienceType)
                      }
                      className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                    >
                      {ALL_AUDIENCES.map((a) => (
                        <option key={a} value={a}>
                          {AUDIENCE_LABELS[a]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3 — Action & Guardrails */}
              {createStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-zinc-800">
                      Channels
                    </label>
                    <div className="space-y-2">
                      {ALL_CHANNELS.map((ch) => (
                        <label
                          key={ch}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                            formChannels.includes(ch)
                              ? "border-zinc-900 bg-zinc-50"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formChannels.includes(ch)}
                            onChange={() => toggleChannel(ch)}
                            className="accent-zinc-900"
                          />
                          <span className="text-sm text-zinc-800">
                            {CHANNEL_LABELS[ch]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Success metric
                    </label>
                    <select
                      value={formSuccessMetric}
                      onChange={(e) =>
                        setFormSuccessMetric(e.target.value as SuccessMetric)
                      }
                      className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                    >
                      {ALL_METRICS.map((m) => (
                        <option key={m} value={m}>
                          {METRIC_LABELS[m]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-zinc-800">
                      Guardrails
                    </label>
                    <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-700">
                          Max sends per week
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={7}
                          value={formGuardrails.maxSendsPerWeek}
                          onChange={(e) =>
                            setFormGuardrails((g) => ({
                              ...g,
                              maxSendsPerWeek: Number(e.target.value),
                            }))
                          }
                          className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                        />
                      </div>
                      {(
                        [
                          ["workingHoursOnly", "Working hours only"] as const,
                          [
                            "excludeRecentlyContacted",
                            "Exclude recently contacted",
                          ] as const,
                          ["approvalRequired", "Requires approval"] as const,
                        ] as const
                      ).map(([key, label]) => (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center justify-between"
                        >
                          <span className="text-sm text-zinc-700">{label}</span>
                          <input
                            type="checkbox"
                            checked={formGuardrails[key]}
                            onChange={(e) =>
                              setFormGuardrails((g) => ({
                                ...g,
                                [key]: e.target.checked,
                              }))
                            }
                            className="accent-zinc-900"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 — AI Recommended Setup */}
              {createStep === 4 && recommended && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <h3 className="mb-1 text-sm font-semibold text-emerald-800">
                      AI-recommended setup for this goal
                    </h3>
                    <p className="text-xs text-emerald-700">
                      Based on your selected goal, here is what works best
                      across similar accounts.
                    </p>
                  </div>
                  <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    {(
                      [
                        ["Trigger", recommended.trigger],
                        ["Audience", recommended.audience],
                        ["Channel", recommended.channel],
                        ["Tone", recommended.tone],
                        ["Follow-up interval", recommended.followUpInterval],
                      ] as [string, string][]
                    ).map(([label, value]) => (
                      <div key={label} className="flex gap-3">
                        <span className="w-32 shrink-0 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                          {label}
                        </span>
                        <span className="text-sm text-zinc-800">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Your action will be saved as a draft. You can edit these
                    settings at any time before activating.
                  </p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
              <button
                onClick={() => {
                  if (createStep > 1) setCreateStep((s) => s - 1);
                  else handleCloseModal();
                }}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {createStep === 1 ? "Cancel" : "Back"}
              </button>
              {createStep < 4 ? (
                <button
                  onClick={() => setCreateStep((s) => s + 1)}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleConfirmCreate}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Create Action
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
