"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";


export function SidebarNav() {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";
  const isPriorityActions = pathname === "/priority-actions";
  const isResponseStudio = pathname === "/response-studio";

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-zinc-900">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
          <Image src="/humand-logo.png" alt="Humand logo" fill sizes="32px" className="object-contain" priority />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight text-white">Growth Engine</div>
          <div className="mt-0.5 text-[10px] leading-tight text-zinc-500">Humand</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {/* Accounts section */}
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Accounts
        </div>
        <Link
          href="/accounts"
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
            pathname === "/accounts"
              ? "bg-white/10 font-medium text-white"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="6" height="6" rx="1.5" />
            <rect x="9" y="1" width="6" height="6" rx="1.5" />
            <rect x="1" y="9" width="6" height="6" rx="1.5" />
            <rect x="9" y="9" width="6" height="6" rx="1.5" />
          </svg>
          All accounts
        </Link>

        {/* Automation section */}
        <div className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Automation
        </div>
        <Link
          href="/actions"
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
            pathname.startsWith("/actions")
              ? "bg-white/10 font-medium text-white"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2L4 9h4l-1 5 5-7H8l1-5z" />
          </svg>
          Growth Actions
        </Link>
        <Link
          href="/response-studio"
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
            isResponseStudio
              ? "bg-white/10 font-medium text-white"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Z" />
            <path d="M1 4l6 5 6-5" />
            <path d="M11 2l2 2-2 2M13 4h-3" />
          </svg>
          Response Studio
        </Link>

        {/* Overview section */}
        <div className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Overview
        </div>
        <Link
          href="/priority-actions"
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
            isPriorityActions
              ? "bg-white/10 font-medium text-white"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2L1.5 13h13L8 2z" />
            <path d="M8 7v3M8 11.5v.5" />
          </svg>
          Priority Actions
        </Link>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
            isDashboard
              ? "bg-white/10 font-medium text-white"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="6" height="8" rx="1.5" />
            <rect x="9" y="1" width="6" height="4" rx="1.5" />
            <rect x="9" y="7" width="6" height="8" rx="1.5" />
            <rect x="1" y="11" width="6" height="4" rx="1.5" />
          </svg>
          Dashboard
        </Link>
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-4 py-3">
        <div className="text-[10px] text-zinc-600">Read-only · AI-simulated insights</div>
      </div>
    </aside>
  );
}
