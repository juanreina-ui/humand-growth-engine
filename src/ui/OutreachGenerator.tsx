"use client";

import { useMemo, useState } from "react";

type Kind = "email" | "internal_note";

export function OutreachGenerator({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  const [kind, setKind] = useState<Kind>("email");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string>("");

  const buttonLabel = useMemo(() => {
    if (kind === "email") return "Generate follow-up email";
    return "Generate internal success note";
  }, [kind]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/outreach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyId, kind }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to generate");
      setText(json.text ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            AI outreach generator
          </div>
          <div className="text-xs text-zinc-600">
            Generates believable copy from account signals + transcript summaries.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 shadow-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
          >
            <option value="email">Follow-up email</option>
            <option value="internal_note">Internal note</option>
          </select>
          <button
            onClick={generate}
            disabled={loading}
            className="h-9 rounded-xl bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating…" : buttonLabel}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {text ? (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Output ({companyName})
            </div>
            <button
              onClick={copy}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 shadow-sm hover:border-zinc-300"
            >
              Copy
            </button>
          </div>
          <textarea
            className="mt-2 h-48 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-5 text-zinc-900"
            readOnly
            value={text}
          />
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
          Pick a format and click generate.
        </div>
      )}
    </div>
  );
}

