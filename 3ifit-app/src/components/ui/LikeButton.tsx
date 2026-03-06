"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Heart } from "lucide-react";

const TOTAL_PARTICLES = 36;

function generateRandomConfigs() {
  return Array.from({ length: TOTAL_PARTICLES }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 100;
    const delay = Math.random() * 120;
    const size = 5 + Math.random() * 11;
    return {
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      delay,
      size,
    };
  });
}

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  userLiked?: boolean;
  onLike?: (postId: string) => Promise<{ success: boolean; newCount?: number }>;
  className?: string;
}

export function LikeButton({
  postId,
  initialCount,
  userLiked = false,
  onLike,
  className = "",
}: LikeButtonProps) {
  const [liked, setLiked] = useState(userLiked);
  const [count, setCount] = useState(initialCount);
  const [burstConfigs, setBurstConfigs] = useState<Array<{
    tx: number;
    ty: number;
    delay: number;
    size: number;
  }> | null>(null);
  const [burstPosition, setBurstPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const heartRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    setLiked(userLiked);
  }, [userLiked]);

  const handleClick = useCallback(async () => {
    if (burstConfigs || userLiked || liked) return;
    const rect = heartRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : 0;
    const y = rect ? rect.top + rect.height / 2 : 0;
    const prevCount = count;
    setBurstConfigs(generateRandomConfigs());
    setBurstPosition({ x, y });
    setLiked(true);
    setCount((c) => c + 1);
    const result = await onLike?.(postId);
    if (result && !result.success) {
      setCount(prevCount);
      setLiked(false);
    } else if (result?.newCount !== undefined) {
      setCount(result.newCount);
    }
    setTimeout(() => {
      setBurstConfigs(null);
      setBurstPosition(null);
    }, 1100);
  }, [postId, onLike, burstConfigs, count, userLiked, liked]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={userLiked || liked}
      className={`relative flex shrink-0 items-center gap-2 overflow-visible rounded-full border border-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold transition-all duration-300 disabled:cursor-default disabled:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
        liked
          ? "scale-110 border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-glow)]"
          : "bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:scale-105 active:scale-95"
      } ${className}`}
    >
      <span
        ref={heartRef}
        className="relative inline-flex h-4 w-4 items-center justify-center overflow-visible"
      >
        <Heart
          className={`h-4 w-4 transition-all duration-300 ${
            liked ? "fill-current scale-110" : ""
          }`}
          fill={liked ? "currentColor" : "none"}
          strokeWidth={2}
        />
      </span>
      {typeof document !== "undefined" &&
        burstConfigs &&
        burstPosition &&
        createPortal(
          <span
            className="pointer-events-none fixed z-[99999] overflow-visible"
            style={{
              left: burstPosition.x,
              top: burstPosition.y,
              width: 260,
              height: 260,
              marginLeft: -130,
              marginTop: -130,
            }}
            aria-hidden
          >
            {burstConfigs.map((p, i) => (
              <span
                key={i}
                className="animate-like-particle absolute left-1/2 top-1/2 rounded-full bg-[var(--color-primary)]"
                style={
                  {
                    "--tx": `${p.tx}px`,
                    "--ty": `${p.ty}px`,
                    "--delay": `${p.delay}ms`,
                    "--size": `${p.size}px`,
                    width: "var(--size)",
                    height: "var(--size)",
                  } as React.CSSProperties
                }
              />
            ))}
          </span>,
          document.body,
        )}
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
