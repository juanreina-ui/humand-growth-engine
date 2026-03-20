export default function AccountsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-6 w-40 rounded-lg bg-zinc-100" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-zinc-100" />
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="h-10 border-b border-zinc-100 bg-zinc-50" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3">
            <div className="h-4 w-40 rounded bg-zinc-100" />
            <div className="h-4 w-20 rounded bg-zinc-100" />
            <div className="h-4 w-24 rounded bg-zinc-100" />
            <div className="h-4 w-16 rounded bg-zinc-100" />
            <div className="h-5 w-28 rounded-full bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
