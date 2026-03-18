"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

const NAV = [
  {
    label: "All accounts",
    href: "/accounts",
    filter: null as string | null,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "High expansion",
    href: "/accounts?filter=high-expansion",
    filter: "high-expansion",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 13V3M3 8l5-5 5 5" />
      </svg>
    ),
  },
  {
    label: "Needs follow-up",
    href: "/accounts?filter=needs-follow-up",
    filter: "needs-follow-up",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3.5l2 2" />
      </svg>
    ),
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");

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
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Accounts
        </div>
        {NAV.map((item) => {
          const isActive =
            pathname === "/accounts" &&
            (item.filter === null ? !filter : filter === item.filter);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                isActive
                  ? "bg-white/10 font-medium text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-4 py-3">
        <div className="text-[10px] text-zinc-600">Read-only · AI-simulated insights</div>
      </div>
    </aside>
  );
}
