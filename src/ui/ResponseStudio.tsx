"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRevenue } from "@/lib/growth/format";
import type { Draft } from "@/lib/ai/responseStudio";

type LocalDraft = Draft & {
  status: "draft" | "sending" | "sent";
  sentAt?: string;
  editSubject: string;
  editBody: string;
  editTo: string;
};

type FilterKey = "all" | "critical" | "saveplay" | "expansion" | "checkin";

function initLocalDraft(d: Draft): LocalDraft {
  return {
    ...d,
    status: "draft",
    editSubject: d.subject,
    editBody: d.body,
    editTo: d.to,
  };
}

// ─── DraftCard ────────────────────────────────────────────────────────────────

function DraftCard({
  item,
  isSelected,
  isEditing,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onSend,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: {
  item: LocalDraft;
  isSelected: boolean;
  isEditing: boolean;
  isExpanded: boolean;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onSend: (id: string) => void;
  onStartEdit: (item: LocalDraft) => void;
  onSaveEdit: (id: string, subject: string, body: string, to: string) => void;
  onCancelEdit: () => void;
}) {
  const [localSubject, setLocalSubject] = useState(item.editSubject);
  const [localBody, setLocalBody] = useState(item.editBody);
  const [localTo, setLocalTo] = useState(item.editTo);

  // Sync local state when editing starts
  function handleStartEdit() {
    setLocalSubject(item.editSubject);
    setLocalBody(item.editBody);
    setLocalTo(item.editTo);
    onStartEdit(item);
  }

  const borderAccent =
    item.status === "sent"
      ? "border-l-gray-300"
      : item.urgency === "critical"
        ? "border-l-rose-500"
        : item.urgency === "high"
          ? "border-l-amber-400"
          : "border-l-sky-400";

  const urgencyBadge =
    item.urgency === "critical"
      ? "bg-rose-100 text-rose-700"
      : item.urgency === "high"
        ? "bg-amber-100 text-amber-700"
        : "bg-sky-100 text-sky-700";

  const typePill =
    item.type === "saveplay"
      ? "bg-rose-50 text-rose-600"
      : item.type === "expansion"
        ? "bg-emerald-50 text-emerald-600"
        : "bg-zinc-100 text-zinc-600";

  const typeLabel =
    item.type === "saveplay"
      ? "Save play"
      : item.type === "expansion"
        ? "Expansion"
        : "Check-in";

  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden border-l-4 ${borderAccent} ${item.status === "sent" ? "opacity-60" : ""}`}
    >
      {/* A. Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={item.status === "sent" || item.status === "sending"}
            onChange={() => onToggleSelect(item.id)}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 disabled:opacity-40"
          />
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none ${urgencyBadge}`}>
            {item.urgency}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${typePill}`}>
            {typeLabel}
          </span>
        </div>
        <div>
          {item.status === "sent" ? (
            <span className="text-[11px] text-emerald-600 font-semibold">
              ✓ Sent {item.sentAt}
            </span>
          ) : item.status === "sending" ? (
            <span className="text-[11px] text-zinc-400 animate-pulse">Sending…</span>
          ) : (
            <button
              onClick={() => onSend(item.id)}
              className="rounded-xl bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-zinc-700"
            >
              Send →
            </button>
          )}
        </div>
      </div>

      {/* B. Account info */}
      <div className="px-4 py-3">
        <Link
          href={`/accounts/${item.companyId}`}
          className="text-sm font-bold text-zinc-900 hover:text-zinc-600 transition-colors"
        >
          {item.companyName}
        </Link>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
          {item.ownerName && <span>Owner: {item.ownerName}</span>}
          {item.ownerName && item.companyRevenue ? <span>·</span> : null}
          {item.companyRevenue ? (
            <span className="font-medium text-emerald-600">{formatRevenue(item.companyRevenue)}</span>
          ) : null}
        </div>
        <div className="mt-1 text-[11px] text-zinc-500">
          <span className="mr-1">⚡</span>
          {item.context}
        </div>
      </div>

      {/* C. To field */}
      <div className="px-4 pb-2">
        <span className="text-[11px] text-zinc-500">
          <span className="font-medium">To:</span>{" "}
          {isEditing ? (
            <input
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value)}
              className="ml-1 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs w-full focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          ) : (
            <span>{item.editTo}</span>
          )}
        </span>
      </div>

      {/* D. Message preview */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold text-zinc-700">Subject</label>
              <input
                value={localSubject}
                onChange={(e) => setLocalSubject(e.target.value)}
                className="mt-1 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs w-full focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700">Body</label>
              <textarea
                rows={10}
                value={localBody}
                onChange={(e) => setLocalBody(e.target.value)}
                className="mt-1 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs w-full focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs text-zinc-700">
              <span className="font-semibold">Subject:</span> {item.editSubject}
            </div>
            <div className="mt-1.5 text-xs text-zinc-500">
              <p className={isExpanded ? "" : "line-clamp-3"}>{item.editBody}</p>
            </div>
            <button
              onClick={() => onToggleExpand(item.id)}
              className="mt-1 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              {isExpanded ? "Collapse ↑" : "Show full message ↓"}
            </button>
          </div>
        )}
      </div>

      {/* E. Action row */}
      <div className="px-4 pb-4 flex justify-end gap-2">
        {isEditing ? (
          <>
            <button
              onClick={onCancelEdit}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveEdit(item.id, localSubject, localBody, localTo)}
              className="rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
            >
              Save changes
            </button>
          </>
        ) : item.status === "draft" ? (
          <>
            <button
              onClick={handleStartEdit}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-100"
            >
              Edit message
            </button>
            <button
              onClick={() => onSend(item.id)}
              className="rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
            >
              Send →
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResponseStudio({ initialDrafts }: { initialDrafts: Draft[] }) {
  const [items, setItems] = useState<LocalDraft[]>(() =>
    initialDrafts.map(initLocalDraft),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterKey>("all");

  // ── Derived values ──────────────────────────────────────────────────────────
  const counts = {
    all: items.length,
    critical: items.filter((d) => d.urgency === "critical").length,
    saveplay: items.filter((d) => d.type === "saveplay").length,
    expansion: items.filter((d) => d.type === "expansion").length,
    checkin: items.filter((d) => d.type === "checkin").length,
  };

  const sentCount = items.filter((d) => d.status === "sent").length;
  const draftCount = items.filter((d) => d.status === "draft").length;

  const filteredItems = items.filter((d) => {
    if (filter === "all") return true;
    if (filter === "critical") return d.urgency === "critical";
    if (filter === "saveplay") return d.type === "saveplay";
    if (filter === "expansion") return d.type === "expansion";
    if (filter === "checkin") return d.type === "checkin";
    return true;
  });

  const selectedDrafts = filteredItems.filter(
    (d) => selected.has(d.id) && d.status === "draft",
  );

  // ── Functions ───────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const d of filteredItems) {
        if (d.status === "draft") next.add(d.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function sendDraft(id: string) {
    setItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "sending" } : d)),
    );
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 700));
    const sentAt = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "sent", sentAt } : d)),
    );
  }

  async function sendSelected() {
    const ids = selectedDrafts.map((d) => d.id);
    clearSelection();
    for (const id of ids) {
      await sendDraft(id);
    }
  }

  function startEdit(item: LocalDraft) {
    setEditing(item.id);
  }

  function saveEdit(id: string, subject: string, body: string, to: string) {
    setItems((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, editSubject: subject, editBody: body, editTo: to }
          : d,
      ),
    );
    setEditing(null);
  }

  function cancelEdit() {
    setEditing(null);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Filter tabs config ──────────────────────────────────────────────────────
  const TABS: { key: FilterKey; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "critical", label: `Critical (${counts.critical})` },
    { key: "saveplay", label: `Save Play (${counts.saveplay})` },
    { key: "expansion", label: `Expansion (${counts.expansion})` },
    { key: "checkin", label: `Check-in (${counts.checkin})` },
  ];

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Drafts ready
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
            {draftCount}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">messages awaiting review</div>
        </div>
        {counts.critical > 0 && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">
              Critical
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-rose-700">
              {counts.critical}
            </div>
            <div className="mt-0.5 text-xs text-rose-500">need immediate action</div>
          </div>
        )}
        <div className={`rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 ${counts.critical === 0 ? "col-span-2" : ""}`}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
            Sent today
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
            {sentCount}
          </div>
          <div className="mt-0.5 text-xs text-emerald-600">messages sent this session</div>
        </div>
      </div>

      {/* Selection action bar */}
      {selectedDrafts.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
          <span className="text-sm font-medium text-zinc-700">
            {selectedDrafts.length} message{selectedDrafts.length === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={sendSelected}
              className="rounded-xl bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
            >
              Send Selected
            </button>
            <button
              onClick={clearSelection}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {draftCount > 0 && (
          <button
            onClick={selectAllVisible}
            className="ml-auto shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100"
          >
            Select all
          </button>
        )}
      </div>

      {/* Draft list */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <DraftCard
              key={item.id}
              item={item}
              isSelected={selected.has(item.id)}
              isEditing={editing === item.id}
              isExpanded={expanded.has(item.id)}
              onToggleSelect={toggleSelect}
              onToggleExpand={toggleExpand}
              onSend={sendDraft}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <div className="text-zinc-400 text-sm">No messages in this view.</div>
          <button
            onClick={() => setFilter("all")}
            className="mt-3 text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            Show all drafts
          </button>
        </div>
      )}
    </div>
  );
}
