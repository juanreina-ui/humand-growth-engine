import { ReactNode } from "react";

const intents = {
  neutral: "border-zinc-200 bg-white text-zinc-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
};

export function Badge({
  children,
  intent = "neutral",
}: {
  children: ReactNode;
  intent?: keyof typeof intents;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        intents[intent],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

