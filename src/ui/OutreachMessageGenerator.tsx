"use client";

import { useState } from "react";
import { buildOutreachMessage } from "@/lib/ai/growthAi";

export function OutreachMessageGenerator({
  companyName,
  headline,
  bullets,
  recommendedExpansion,
}: {
  companyName: string;
  headline: string;
  bullets: string[];
  recommendedExpansion: string;
}) {
  const [message, setMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  function generate() {
    setMessage(
      buildOutreachMessage({ companyName, headline, bullets, recommendedExpansion })
    );
    setCopied(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Outreach message
        </div>
        <button
          onClick={generate}
          className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-zinc-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-700"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M2 8h12M8 2l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Generate outreach message
        </button>
      </div>

      {message ? (
        <div className="mt-3">
          <div className="flex items-center justify-end">
            <button
              onClick={copy}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea
            className="mt-2 h-56 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-5 text-zinc-900 focus:outline-none"
            readOnly
            value={message}
          />
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-3 text-xs text-zinc-500">
          Click &ldquo;Generate outreach message&rdquo; to create a personalized email from the AI insight above.
        </div>
      )}
    </div>
  );
}
