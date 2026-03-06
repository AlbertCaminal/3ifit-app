/**
 * Tipos centralizados para entidades de la base de datos y resultados de API.
 * Sincronizado con el esquema de Supabase (migrations).
 */

export type PlanType = "basico" | "estandar" | "pro";

// ─── Tablas base ───────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  avatar_url: string | null;
  full_name: string | null;
  email: string | null;
  department_id: string | null;
  level: number;
  points: number;
  minutes_total: number;
  onboarding_completed_at: string | null;
  plan: PlanType | null;
  plan_changed_week_start: string | null;
  department_changed_week_start: string | null;
  privacy_individual: boolean;
  notifications_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at?: string;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at?: string;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  minutes: number;
  notes: string | null;
  created_at: string;
}

export interface FeedPostRow {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

export interface LeaderboardEntryRow {
  id: string;
  user_id: string;
  season_id: string;
  minutes: number;
  created_at: string;
  updated_at: string;
}

export interface XpEvent {
  id: string;
  user_id: string;
  event_type: string;
  amount: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface WeeklyPlanCompletion {
  id: string;
  user_id: string;
  week_start: string;
  plan: PlanType;
  created_at?: string;
}

// ─── Resultados de API (comunidad) ──────────────────────────────────────────

export interface FeedPost {
  id: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  user_liked: boolean;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
  user_level: number;
}

// ─── Resultados de API (ranking) ────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  department_name: string | null;
  minutes: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface SeasonInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
}

export interface DepartmentRankingEntry {
  department_id: string;
  department_name: string;
  minutes: number;
  rank: number;
  progress: number;
  isCurrentUserDepartment?: boolean;
}

// ─── Resultados de API (misiones) ───────────────────────────────────────────

export interface UserMission {
  id: string;
  missionId: string;
  slug: string;
  title: string;
  xpReward: number;
  targetValue: number | null;
  progress: number;
  completedAt: string | null;
  type: "fixed" | "pool";
}

// ─── Resultados de API (home) ──────────────────────────────────────────────

export interface HomeProfileResult {
  avatar_url: string | null;
  full_name: string | null;
  plan: PlanType | null;
  level: number;
  department_name: string | null;
  department_id?: string | null;
  today_minutes: number;
  today_goal: number;
  days_completed: number;
  days_total: number;
  xpEarned?: number;
  perfectStreakWeeks: number;
}
