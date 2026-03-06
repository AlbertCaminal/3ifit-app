"use server";

import { getHomeDataRpc } from "../home/actions";

export type ReminderStatus = {
  daysRemaining: number;
  hasActivityToday: boolean;
} | null;

export async function getReminderStatus(): Promise<ReminderStatus> {
  const data = await getHomeDataRpc();
  if (!data) return null;

  const daysTotal = data.days_total ?? 3;
  const daysCompleted = data.days_completed ?? 0;
  const daysRemaining = Math.max(0, daysTotal - daysCompleted);
  const hasActivityToday = (data.today_minutes ?? 0) > 0;

  return { daysRemaining, hasActivityToday };
}
