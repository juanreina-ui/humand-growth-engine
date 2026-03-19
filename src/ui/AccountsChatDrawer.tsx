"use client";

import { useState } from "react";
import { AccountsChat, type ChatAccount } from "@/ui/AccountsChat";

export { type ChatAccount };

export function AccountsChatDrawer({ accounts }: { accounts: ChatAccount[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
      >
        <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" />
          <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none" />
        </svg>
        Ask Vejj
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col shadow-2xl">
            <AccountsChat accounts={accounts} onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
