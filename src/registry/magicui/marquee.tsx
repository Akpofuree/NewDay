"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children?: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
  [key: string]: any;
}

export default function Marquee({
  className,
  reverse,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  const [scope, setScope] = useState<HTMLElement | null>(null);
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    if (ref) {
      const animationDuration = parseFloat(
        ref.getAttribute("data-duration") || "20",
      );
      setDuration(animationDuration * 1000);
    }
  }, [ref]);

  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:30s] [--gap:1rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
      style={{
        "--gap": "1rem",
      } as CSSProperties}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          ref={i === 0 ? setRef : undefined}
          className="flex shrink-0 justify-around [gap:var(--gap)]"
          style={{
            animationName: "marquee",
            animationDuration: `${duration}ms`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDirection: reverse ? "reverse" : "normal",
            animationPlayState: pauseOnHover ? "paused" : "running",
          }}
        >
          {children}
        </div>
      ))}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% - var(--gap)));
          }
        }
        .group:hover [style*="animation-play-state"] {
          animation-play-state: ${pauseOnHover ? "paused" : "running"};
        }
      `}</style>
    </div>
  );
}
