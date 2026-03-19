// ─── Types ─────────────────────────────────────────────────────────────────────

export type ActionStatus = "active" | "draft" | "paused";
export type ActionGoal =
  | "increase_activation"
  | "reduce_churn"
  | "increase_feature_adoption"
  | "increase_expansion";
export type TriggerType =
  | "inactivity"
  | "low_adoption"
  | "high_engagement_missing_module"
  | "high_commercial_intent";
export type AudienceType =
  | "new_admins"
  | "inactive_admins"
  | "high_potential"
  | "specific_segment";
export type ActionChannelType =
  | "ai_email"
  | "in_app_prompt"
  | "cx_outreach"
  | "reminder_sequence";
export type SuccessMetric =
  | "return_login_rate"
  | "feature_activation_rate"
  | "open_rate"
  | "expansion_conversion";

export type Guardrails = {
  maxSendsPerWeek: number;
  workingHoursOnly: boolean;
  excludeRecentlyContacted: boolean;
  approvalRequired: boolean;
};

export type ExecutionEntry = {
  id: string;
  date: string; // ISO string
  triggerDescription: string;
  audienceCount: number;
  actionPerformed: string;
  messageSnippet: string;
  outcome: { sent: number; opened: number; clicked: number; converted: number };
  aiNote: string;
};

export type GrowthAction = {
  id: string;
  name: string;
  status: ActionStatus;
  goal: ActionGoal;
  triggerType: TriggerType;
  triggerThreshold: number;
  triggerDescription: string;
  audienceType: AudienceType;
  audienceDescription: string;
  channels: ActionChannelType[];
  guardrails: Guardrails;
  successMetric: SuccessMetric;
  createdAt: string;
  lastRun: string | null;
  lastOutcome: string | null;
  metrics: {
    totalExecutions: number;
    audienceReached: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  executionHistory: ExecutionEntry[];
  sampleMessage: { subject: string; body: string };
};

// ─── Label maps ────────────────────────────────────────────────────────────────

export const GOAL_LABELS: Record<ActionGoal, string> = {
  increase_activation: "Increase activation",
  reduce_churn: "Reduce churn",
  increase_feature_adoption: "Increase feature adoption",
  increase_expansion: "Increase expansion opportunities",
};

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  inactivity: "Inactivity for X days",
  low_adoption: "Low adoption below X%",
  high_engagement_missing_module: "High engagement but missing module usage",
  high_commercial_intent: "High commercial intent",
};

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  new_admins: "New admins",
  inactive_admins: "Inactive admins",
  high_potential: "High-potential accounts",
  specific_segment: "Specific segment",
};

export const CHANNEL_LABELS: Record<ActionChannelType, string> = {
  ai_email: "AI email campaign",
  in_app_prompt: "In-app prompt",
  cx_outreach: "CX outreach draft",
  reminder_sequence: "Reminder sequence",
};

export const METRIC_LABELS: Record<SuccessMetric, string> = {
  return_login_rate: "Return login rate",
  feature_activation_rate: "Feature activation rate",
  open_rate: "Open rate",
  expansion_conversion: "Expansion conversion",
};

// ─── Helper functions ──────────────────────────────────────────────────────────

export function buildActionReasoning(action: GrowthAction): {
  why: string;
  signal: string;
  channel: string;
} {
  const whyMap: Record<ActionGoal, string> = {
    reduce_churn: `This action targets admins who have not logged in for ${action.triggerThreshold} days — a leading indicator of churn. Early re-engagement reduces licence cancellations and protects MRR. Catching disengagement early is significantly cheaper than win-back campaigns after cancellation.`,
    increase_activation: `This action identifies new admins who have not yet completed core onboarding steps within ${action.triggerThreshold} days of sign-up. Activation within the first 30 days is the strongest predictor of long-term retention. Proactive nudges at this stage reduce time-to-value and lift paid conversion rates.`,
    increase_feature_adoption: `This action targets high-engagement accounts that are missing key module usage — representing untapped value already within reach. Accounts that adopt two or more modules show 3× higher retention and 2× higher NPS scores. Closing the adoption gap converts latent potential into measurable outcomes.`,
    increase_expansion: `This action surfaces accounts exhibiting strong commercial intent signals, enabling the CX team to act while buying momentum is high. Expansion opportunities are most likely to close when engagement with multiple stakeholders is recent and concentrated. Timely outreach can increase expansion conversion rates by 30–40%.`,
  };

  const signalMap: Record<TriggerType, string> = {
    inactivity: `Monitors ${action.triggerDescription}. When the threshold is crossed, accounts are scored and ranked by revenue impact before outreach is triggered. The system checks daily and batches eligible contacts to avoid over-communication.`,
    low_adoption: `Monitors ${action.triggerDescription}. Adoption scores are calculated weekly across all active modules and compared against account benchmarks. Accounts that fall below the threshold are queued for the next scheduled outreach window.`,
    high_engagement_missing_module: `Monitors ${action.triggerDescription}. The engine cross-references engagement scores with module activation records to identify the gap. Only accounts with a growth score above the threshold are eligible to avoid noise from low-quality signals.`,
    high_commercial_intent: `Monitors ${action.triggerDescription}. Intent signals include repeated login activity, multi-stakeholder sessions, and open CRM opportunities. Scores above the threshold trigger an immediate CX briefing rather than an automated send, preserving relationship quality.`,
  };

  const channelMap: Record<ActionChannelType, string> = {
    ai_email: `AI email campaigns achieve 2–3× higher open rates than generic sequences for re-engagement scenarios. Personalised subject lines are generated per recipient using account context. The system selects the highest-performing subject variant based on historical A/B data from similar accounts.`,
    in_app_prompt: `In-app prompts intercept users at the moment of highest intent — when they are already inside the product. Contextual banners and tooltips outperform email for feature discovery by reaching users who are actively engaged. Prompt copy is dynamically tailored to the account's current usage pattern.`,
    cx_outreach: `CX-drafted outreach is reserved for high-value accounts where automated messaging would feel impersonal. A briefing note is generated and routed to the assigned CX manager for review before any contact is made. This preserves relationship quality while eliminating the research burden from the CX team.`,
    reminder_sequence: `Reminder sequences maintain a lightweight, persistent presence without triggering send fatigue. Intervals are spaced to respect guardrail limits while keeping the account warm across multiple touchpoints. Each message in the sequence adapts tone based on whether earlier messages were opened.`,
  };

  const primaryChannel = action.channels[0] ?? "ai_email";

  return {
    why: whyMap[action.goal],
    signal: signalMap[action.triggerType],
    channel: channelMap[primaryChannel],
  };
}

export function getRecommendedSetup(goal: ActionGoal): {
  trigger: string;
  audience: string;
  channel: string;
  tone: string;
  followUpInterval: string;
} {
  const setupMap: Record<
    ActionGoal,
    {
      trigger: string;
      audience: string;
      channel: string;
      tone: string;
      followUpInterval: string;
    }
  > = {
    reduce_churn: {
      trigger: "No admin login in 14 days",
      audience: "Inactive admins with no session in last 14 days",
      channel: "AI email campaign",
      tone: "Warm and personal — acknowledge absence, highlight value missed",
      followUpInterval: "Follow up after 5 days if no re-engagement",
    },
    increase_activation: {
      trigger: "Admin created account but hasn't completed setup in 7 days",
      audience: "New admins in their first 30 days",
      channel: "In-app prompt + reminder sequence",
      tone: "Encouraging and instructional — guide with clear steps",
      followUpInterval: "Follow up every 3 days up to 3 times",
    },
    increase_feature_adoption: {
      trigger: "High engagement score but zero usage of target module in 21 days",
      audience: "High-potential accounts with growth score ≥ 65",
      channel: "In-app prompt + AI email campaign",
      tone: "Value-focused — lead with outcomes, not features",
      followUpInterval: "Follow up after 7 days if module not activated",
    },
    increase_expansion: {
      trigger: "Growth score ≥ 75 with 3+ stakeholders active in last 7 days",
      audience: "Accounts with open commercial opportunities in CRM",
      channel: "CX outreach draft (human review required)",
      tone: "Professional and insight-driven — brief the CX team, not the customer",
      followUpInterval: "CX team to action within 48 hours of briefing",
    },
  };

  return setupMap[goal];
}

// Static execution counter used to make simulateExecution deterministic within a session
let _execCounter = 0;

export function simulateExecution(action: GrowthAction): ExecutionEntry {
  _execCounter += 1;
  const counter = _execCounter;

  // Deterministic audience count based on counter and action id hash
  const idSum = action.id
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const audienceCount = 15 + ((idSum + counter * 7) % 30);

  const sent = audienceCount;
  const opened = Math.floor(sent * 0.65);
  const clicked = Math.floor(opened * 0.45);
  const converted = Math.floor(clicked * 0.35);

  const aiNotes = [
    "Accounts with subject line personalisation showed 18% higher open rates.",
    "3 accounts showed re-engagement within 24h of send.",
    "Subject line A/B: variant with name outperformed by 14%.",
    "2 accounts escalated to CX for follow-up after clicking CTA.",
    "Delivery rate was 100% — no bounces or spam flags recorded.",
  ];

  const actionPerformedMap: Record<ActionChannelType, string> = {
    ai_email: "AI email sent with personalised subject line",
    in_app_prompt: "In-app prompt displayed on next login",
    cx_outreach: "CX outreach draft generated and routed for review",
    reminder_sequence: "Reminder sequence step triggered",
  };

  const primaryChannel = action.channels[0] ?? "ai_email";

  return {
    id: `exec-sim-${Date.now()}-${counter}`,
    date: new Date().toISOString(),
    triggerDescription: action.triggerDescription,
    audienceCount,
    actionPerformed: actionPerformedMap[primaryChannel],
    messageSnippet: action.sampleMessage.subject,
    outcome: { sent, opened, clicked, converted },
    aiNote: aiNotes[(idSum + counter) % aiNotes.length],
  };
}

export function duplicateAction(
  action: GrowthAction,
  newId: string
): GrowthAction {
  return {
    ...action,
    id: newId,
    name: `Copy of ${action.name}`,
    status: "draft",
    lastRun: null,
    lastOutcome: null,
    createdAt: new Date().toISOString(),
    executionHistory: [],
    metrics: {
      totalExecutions: 0,
      audienceReached: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
    },
  };
}

// ─── Demo data ─────────────────────────────────────────────────────────────────

export const DEMO_ACTIONS: GrowthAction[] = [
  // ── Action 1 — Recover Inactive Admins ──────────────────────────────────────
  {
    id: "action-1",
    name: "Recover Inactive Admins",
    status: "active",
    goal: "reduce_churn",
    triggerType: "inactivity",
    triggerThreshold: 14,
    triggerDescription: "No admin login in 14 days",
    audienceType: "inactive_admins",
    audienceDescription:
      "Admins with no session recorded in the last 14 days",
    channels: ["ai_email"],
    guardrails: {
      maxSendsPerWeek: 2,
      workingHoursOnly: true,
      excludeRecentlyContacted: true,
      approvalRequired: false,
    },
    successMetric: "return_login_rate",
    createdAt: "2026-02-10T09:00:00Z",
    lastRun: "2026-03-18T08:30:00Z",
    lastOutcome: "34 emails sent · 22 opened · 9 admins returned",
    metrics: {
      totalExecutions: 18,
      audienceReached: 287,
      openRate: 67,
      clickRate: 31,
      conversionRate: 19,
    },
    sampleMessage: {
      subject: "We miss you — here's what's new in Humand",
      body: `Hi [Name],

We noticed you haven't logged into Humand in a little while, and we wanted to reach out. Your team has been busy — and there are a few things happening inside the platform that you won't want to miss.

Since your last visit, your team has published new survey results that are waiting for your review. There are also three new workflows your colleagues have set up that could save you time on your weekly reporting. These changes happened while you were away, and they're ready for you to explore the moment you log back in.

We also want to make sure you're getting the most out of Humand. If it would help, we'd be happy to set up a quick 15-minute onboarding refresh call — no agenda, just a chance to make sure the platform is working the way you need it to.

Log back in now to catch up on what you've missed. We're here if you need anything.

The Humand Team`,
    },
    executionHistory: [
      {
        id: "exec-1-5",
        date: "2026-03-18T08:30:00Z",
        triggerDescription: "No admin login in 14 days",
        audienceCount: 34,
        actionPerformed: "AI email sent with personalised subject line",
        messageSnippet: "We miss you — here's what's new in Humand",
        outcome: { sent: 34, opened: 22, clicked: 11, converted: 9 },
        aiNote:
          "Subject line A/B: variant with name outperformed by 14%.",
      },
      {
        id: "exec-1-4",
        date: "2026-03-11T09:15:00Z",
        triggerDescription: "No admin login in 14 days",
        audienceCount: 29,
        actionPerformed: "AI email sent with personalised subject line",
        messageSnippet: "We miss you — here's what's new in Humand",
        outcome: { sent: 29, opened: 19, clicked: 8, converted: 6 },
        aiNote:
          "3 accounts showed re-engagement within 24h of send.",
      },
      {
        id: "exec-1-3",
        date: "2026-03-04T08:45:00Z",
        triggerDescription: "No admin login in 14 days",
        audienceCount: 52,
        actionPerformed: "AI email sent with personalised subject line",
        messageSnippet: "We miss you — here's what's new in Humand",
        outcome: { sent: 52, opened: 36, clicked: 17, converted: 11 },
        aiNote:
          "Accounts with subject line personalisation showed 18% higher open rates.",
      },
      {
        id: "exec-1-2",
        date: "2026-02-25T08:30:00Z",
        triggerDescription: "No admin login in 14 days",
        audienceCount: 41,
        actionPerformed: "AI email sent with personalised subject line",
        messageSnippet: "We miss you — here's what's new in Humand",
        outcome: { sent: 41, opened: 27, clicked: 12, converted: 7 },
        aiNote:
          "2 accounts escalated to CX for follow-up after clicking CTA.",
      },
      {
        id: "exec-1-1",
        date: "2026-02-15T09:00:00Z",
        triggerDescription: "No admin login in 14 days",
        audienceCount: 18,
        actionPerformed: "AI email sent with personalised subject line",
        messageSnippet: "We miss you — here's what's new in Humand",
        outcome: { sent: 18, opened: 12, clicked: 5, converted: 3 },
        aiNote:
          "First run established baseline metrics for this segment.",
      },
    ],
  },

  // ── Action 2 — Increase Surveys Adoption ────────────────────────────────────
  {
    id: "action-2",
    name: "Increase Surveys Adoption",
    status: "active",
    goal: "increase_feature_adoption",
    triggerType: "high_engagement_missing_module",
    triggerThreshold: 21,
    triggerDescription:
      "High engagement score but zero Surveys module usage in 21 days",
    audienceType: "high_potential",
    audienceDescription:
      "Accounts with growth score ≥ 65 that have never activated the Surveys module",
    channels: ["in_app_prompt", "ai_email"],
    guardrails: {
      maxSendsPerWeek: 1,
      workingHoursOnly: true,
      excludeRecentlyContacted: true,
      approvalRequired: false,
    },
    successMetric: "feature_activation_rate",
    createdAt: "2026-02-18T11:00:00Z",
    lastRun: "2026-03-17T10:00:00Z",
    lastOutcome: "28 prompts shown · 19 clicked · 6 accounts activated Surveys",
    metrics: {
      totalExecutions: 11,
      audienceReached: 163,
      openRate: 71,
      clickRate: 44,
      conversionRate: 23,
    },
    sampleMessage: {
      subject: "You're missing a trick — your team hasn't tried Surveys yet",
      body: `Hi [Name],

Your team is one of the most engaged on Humand — your activity score puts you in the top 20% of accounts your size. That's a great foundation. But there's one area where you could be unlocking even more value: Surveys.

The Surveys module lets you collect structured feedback directly from your employees inside the same platform your team already uses every day. Run a quick pulse survey after your next all-hands, gather input before a major decision, or track sentiment over time with recurring check-ins. Accounts that activate Surveys report a 35% improvement in decision confidence within the first quarter.

Activating it takes less than two minutes. Click below to switch it on and run your first survey today — no extra setup required.

Activate Surveys in 2 minutes →

The Humand Team`,
    },
    executionHistory: [
      {
        id: "exec-2-3",
        date: "2026-03-17T10:00:00Z",
        triggerDescription:
          "High engagement score but zero Surveys module usage in 21 days",
        audienceCount: 28,
        actionPerformed:
          "In-app prompt displayed + AI email sent",
        messageSnippet:
          "You're missing a trick — your team hasn't tried Surveys yet",
        outcome: { sent: 28, opened: 20, clicked: 12, converted: 6 },
        aiNote:
          "In-app prompt click-through rate was 3× higher than email for this segment.",
      },
      {
        id: "exec-2-2",
        date: "2026-03-03T10:30:00Z",
        triggerDescription:
          "High engagement score but zero Surveys module usage in 21 days",
        audienceCount: 35,
        actionPerformed:
          "In-app prompt displayed + AI email sent",
        messageSnippet:
          "You're missing a trick — your team hasn't tried Surveys yet",
        outcome: { sent: 35, opened: 25, clicked: 16, converted: 8 },
        aiNote:
          "4 accounts activated Surveys within 48h of receiving the in-app prompt.",
      },
      {
        id: "exec-2-1",
        date: "2026-02-24T11:00:00Z",
        triggerDescription:
          "High engagement score but zero Surveys module usage in 21 days",
        audienceCount: 21,
        actionPerformed:
          "In-app prompt displayed + AI email sent",
        messageSnippet:
          "You're missing a trick — your team hasn't tried Surveys yet",
        outcome: { sent: 21, opened: 14, clicked: 8, converted: 4 },
        aiNote:
          "First run. Segment identified using growth score threshold ≥ 65.",
      },
    ],
  },

  // ── Action 3 — Flag High-Expansion Accounts ─────────────────────────────────
  {
    id: "action-3",
    name: "Flag High-Expansion Accounts",
    status: "draft",
    goal: "increase_expansion",
    triggerType: "high_commercial_intent",
    triggerThreshold: 75,
    triggerDescription:
      "Growth score ≥ 75 with repeated engagement signals in last 7 days",
    audienceType: "specific_segment",
    audienceDescription:
      "CX team — accounts with 3+ stakeholders active and at least one open commercial opportunity",
    channels: ["cx_outreach"],
    guardrails: {
      maxSendsPerWeek: 1,
      workingHoursOnly: true,
      excludeRecentlyContacted: false,
      approvalRequired: true,
    },
    successMetric: "expansion_conversion",
    createdAt: "2026-03-01T14:00:00Z",
    lastRun: null,
    lastOutcome: null,
    metrics: {
      totalExecutions: 0,
      audienceReached: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
    },
    sampleMessage: {
      subject:
        "Expansion opportunity flagged — [Company] is showing strong buying signals",
      body: `Account Summary
Company: [Company] · Plan: Growth · ARR: [ARR] · CX Owner: [Owner]
Contract renewal: [Renewal Date] · Open opportunity: Upgrade to Enterprise

Signals Detected (last 7 days)
• Growth score reached 78 — up from 61 four weeks ago
• 4 distinct stakeholders logged in across 3 consecutive days
• Admin accessed the Billing and Integrations pages 6 times combined
• Support ticket volume dropped 40% — satisfaction trending positive
• Engagement with feature announcement emails increased (3 opens, 2 clicks)

Recommended Next Action
Reach out to [Primary Contact] within the next 48 hours to introduce the Enterprise tier. Lead with the integrations and advanced reporting capabilities — those are the pages they've been exploring. A brief 20-minute discovery call is the suggested first step. If the primary contact is unresponsive, escalate to [Secondary Stakeholder] who has also been active this week.

Deadline: Action by [Date + 2 days] to capitalise on current momentum.`,
    },
    executionHistory: [],
  },
];
