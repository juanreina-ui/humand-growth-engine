import { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-zinc-100 bg-white/80 p-5 shadow-sm shadow-zinc-100/80 backdrop-blur",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

