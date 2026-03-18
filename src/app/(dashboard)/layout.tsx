import { ReactNode, Suspense } from "react";
import { SidebarNav } from "@/ui/SidebarNav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-zinc-50">
      <Suspense fallback={<div className="h-screen w-56 shrink-0 bg-zinc-900" />}>
        <SidebarNav />
      </Suspense>
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
