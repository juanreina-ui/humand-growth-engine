export default function AccountDetailLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-4 w-32 rounded bg-zinc-100" />
      <div className="h-36 rounded-2xl bg-zinc-200" />
      <div className="space-y-4">
        <div className="flex gap-4 border-b border-zinc-200 pb-px">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-24 rounded bg-zinc-100" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-100" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-zinc-100" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 rounded-2xl bg-zinc-100" />
          <div className="h-32 rounded-2xl bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
