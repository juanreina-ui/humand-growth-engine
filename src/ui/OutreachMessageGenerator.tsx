"use client";

import { useState } from "react";
import {
  buildOutreachMessage,
  type OutreachParams,
  type MessageType,
} from "@/lib/ai/growthAi";

const TYPE_META: Record<MessageType, { label: string; description: string }> = {
  expansion: {
    label: "Expansion pitch",
    description: "Capitalise on engagement to drive upsell",
  },
  checkin: {
    label: "Check-in",
    description: "Warm follow-up to keep the relationship active",
  },
  saveplay: {
    label: "Save play",
    description: "Urgent outreach to recover a at-risk account",
  },
};

function defaultType(status: string, sentiment: string): MessageType {
  if (status === "At risk" || sentiment === "negative") return "saveplay";
  if (status === "High expansion potential") return "expansion";
  return "checkin";
}

export function OutreachMessageGenerator(props: OutreachParams) {
  const [type, setType] = useState<MessageType>(() =>
    defaultType(props.status, props.sentiment),
  );
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  function generate() {
    setResult(buildOutreachMessage(props, type));
    setCopiedSubject(false);
    setCopiedBody(false);
  }

  async function copy(text: string, which: "subject" | "body") {
    await navigator.clipboard.writeText(text);
    if (which === "subject") {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  }

  // Regenerate whenever type changes if a result is already showing
  function selectType(t: MessageType) {
    setType(t);
    if (result) setResult(buildOutreachMessage(props, t));
  }

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Outreach message
        </div>
        <button
          onClick={generate}
          className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-zinc-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-700"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 8A5 5 0 1 1 8 3" /><path d="M13 3v5h-5" />
          </svg>
          {result ? "Regenerate" : "Generate"}
        </button>
      </div>

      {/* Message type selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.entries(TYPE_META) as [MessageType, typeof TYPE_META[MessageType]][]).map(
          ([t, meta]) => (
            <button
              key={t}
              onClick={() => selectType(t)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                type === t
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white"
              }`}
            >
              <div className="text-[11px] font-semibold">{meta.label}</div>
              <div className={`mt-0.5 text-[10px] leading-tight ${type === t ? "text-zinc-300" : "text-zinc-400"}`}>
                {meta.description}
              </div>
            </button>
          ),
        )}
      </div>

      {/* Message preview */}
      {result ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden">
          {/* Subject line */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-white px-4 py-2.5">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Subject </span>
              <span className="text-sm font-medium text-zinc-900">{result.subject}</span>
            </div>
            <button
              onClick={() => copy(result.subject, "subject")}
              className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold text-zinc-600 transition hover:bg-zinc-100"
            >
              {copiedSubject ? "Copied!" : "Copy"}
            </button>
          </div>
          {/* Body */}
          <div className="relative p-4">
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-zinc-700">
              {result.body}
            </pre>
            <button
              onClick={() => copy(result.body, "body")}
              className="absolute right-3 top-3 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50"
            >
              {copiedBody ? "Copied!" : "Copy body"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-xs text-zinc-500">
          Select a message type above, then click <strong className="text-zinc-700">Generate</strong> to create a personalised email based on this account&apos;s signals.
        </div>
      )}
    </div>
  );
}
