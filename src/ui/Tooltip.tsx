"use client";

import { useState, useRef } from "react";

export function Tooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  function show() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.top });
    }
    setVisible(true);
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        className="inline-flex cursor-help items-center"
      >
        {children}
      </span>
      {visible && (
        <div
          className="pointer-events-none fixed z-[100] w-64 -translate-x-1/2 -translate-y-full rounded-xl bg-zinc-900 p-3 text-xs leading-relaxed text-zinc-200 shadow-xl"
          style={{ left: pos.x, top: pos.y - 10 }}
        >
          {content}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
        </div>
      )}
    </>
  );
}
