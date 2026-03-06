"use client";

import { useRef, useState, useCallback } from "react";
import { ThumbsUp } from "lucide-react";
import { useXP } from "@/contexts/XPContext";
import { getLevelColor } from "@/lib/levels";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { LikeButton } from "@/components/ui/LikeButton";
import { likePost } from "./actions";
import type { FeedPost } from "./actions";

interface ClapXPStatus {
  clapXPToday: number;
  clapXPLimit: number;
  remaining: number;
}

interface ComunidadClientProps {
  posts: FeedPost[];
  clapXPStatus?: ClapXPStatus;
}

export default function ComunidadClient({
  posts: initialPosts,
  clapXPStatus: initialClapStatus,
}: ComunidadClientProps) {
  const { showXP } = useXP();
  const [posts, setPosts] = useState(initialPosts);
  const [clapXPStatus, setClapXPStatus] = useState(initialClapStatus);
  const lastShownForPostRef = useRef<{ postId: string; time: number } | null>(
    null,
  );

  const handleLike = useCallback(
    async (postId: string) => {
      // Optimistic update: actualizar UI inmediatamente
      const prevPosts = posts;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes_count: p.likes_count + 1, user_liked: true }
            : p,
        ),
      );
      const result = await likePost(postId);
      if (!result.success) {
        setPosts(prevPosts);
        return result;
      }
      if (result.xpEarned && result.xpEarned > 0) {
        const now = Date.now();
        const last = lastShownForPostRef.current;
        if (!last || last.postId !== postId || now - last.time > 2000) {
          lastShownForPostRef.current = { postId, time: now };
          showXP(result.xpEarned);
        }
        setClapXPStatus((prev) =>
          prev
            ? {
                ...prev,
                clapXPToday: prev.clapXPToday + result.xpEarned!,
                remaining: Math.max(0, prev.remaining - result.xpEarned!),
              }
            : prev,
        );
      }
      if (result.newCount !== undefined) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likes_count: result.newCount!, user_liked: true }
              : p,
          ),
        );
      }
      return result;
    },
    [posts, showXP],
  );
  const isEmpty = !posts || posts.length === 0;
  const displayClapStatus = clapXPStatus ?? initialClapStatus;

  if (isEmpty) {
    return (
      <div className="flex flex-1 flex-col bg-[var(--background)]">
        <PageHeader title="Comunidad" />
        <div className="flex flex-1 flex-col gap-5 overflow-auto px-6 pt-3 pb-7">
          <EmptyState
            imageSrc="/images/empty.jpg"
            actionLabel="Registrar actividad"
            actionHref="/app/registrar-actividad"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      <PageHeader title="Comunidad" />
      <div className="flex flex-1 flex-col gap-5 overflow-auto px-6 pt-4 pb-7">
        {displayClapStatus && (
          <Card variant="muted" className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <ThumbsUp className="h-4 w-4 text-[var(--color-primary)]" />
              <span
                className={
                  displayClapStatus.remaining === 0
                    ? "text-[var(--color-text-muted-light)]"
                    : "font-medium text-[var(--color-text-primary)]"
                }
              >
                {displayClapStatus.remaining === 0
                  ? "Ya ganaste +10 XP hoy por dar ánimos"
                  : `Da ánimos para +2 XP cada uno · Te quedan ${displayClapStatus.remaining} XP hoy`}
              </span>
            </div>
          </Card>
        )}
        <div className="flex flex-1 flex-col gap-3 overflow-auto">
          {posts.map((post) => {
            const hasImage = !!post.image_url;
            return (
              <Card
                key={post.id}
                variant="default"
                className="relative flex w-full flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const level = post.user_level ?? 1;
                    const avatar = (
                      <Avatar
                        src={post.user_avatar}
                        alt={post.user_name ?? "Usuario"}
                        size="md"
                      />
                    );
                    const gradients: Record<number, string> = {
                      1: "linear-gradient(135deg, #b87333 0%, #cd7f32 25%, #e8d5c4 50%, #cd7f32 75%, #b87333 100%)",
                      2: "linear-gradient(135deg, #a8a8a8 0%, #c0c0c0 25%, #e8e8e8 50%, #c0c0c0 75%, #a8a8a8 100%)",
                      3: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 25%, #fef3c7 50%, #fbbf24 75%, #f59e0b 100%)",
                      4: "linear-gradient(135deg, #e09696 0%, #f0b8b8 25%, #fce4e4 50%, #f0b8b8 75%, #e09696 100%)",
                      5: "linear-gradient(135deg, #38bdf8 0%, #7dd3fc 25%, #a5f3fc 50%, #7dd3fc 75%, #38bdf8 100%)",
                    };
                    const grad = gradients[level];
                    if (grad) {
                      return (
                        <div
                          className="flex shrink-0 rounded-full p-[3px]"
                          style={{ background: grad }}
                        >
                          <div className="overflow-hidden rounded-full">
                            {avatar}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        className="flex shrink-0 rounded-full p-1"
                        style={{
                          border: "3px solid",
                          borderColor: getLevelColor(level),
                        }}
                      >
                        {avatar}
                      </div>
                    );
                  })()}
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {post.user_name}
                    </span>
                    <p className="text-sm text-[var(--color-text-primary)]">
                      {post.content}
                    </p>
                  </div>
                  <LikeButton
                    postId={post.id}
                    initialCount={post.likes_count}
                    userLiked={post.user_liked}
                    onLike={handleLike}
                  />
                </div>
                {hasImage && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--color-bg-muted)]">
                    <img
                      src={post.image_url!}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
