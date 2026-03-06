import { z } from "zod";

const ACTIVITY_TYPES = [
  "walking",
  "cycling",
  "running",
  "yoga",
  "meditation",
  "gym",
  "swimming",
  "hiking",
  "stretching",
  "other",
] as const;

export const registerActivitySchema = z.object({
  activity_type: z.string().min(1).max(50),
  minutes: z.number().int().min(1).max(999),
  notes: z.string().max(500).optional(),
  share_to_feed: z.boolean().optional(),
  image_url: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (!v || v.trim() === "" ? null : v)),
});

export const updateProfileSettingsSchema = z.object({
  plan: z.enum(["basico", "estandar", "pro"]).optional(),
  privacy_individual: z.boolean().optional(),
  department_id: z.string().min(1).nullable().optional(),
  notifications_enabled: z.boolean().optional(),
});

export const completeOnboardingSchema = z.object({
  plan: z.enum(["basico", "estandar", "pro"]).nullable(),
  departmentId: z
    .string()
    .nullable()
    .transform((v) => (!v || v.trim() === "" ? null : v)),
  privacyIndividual: z.boolean(),
});

export const likePostSchema = z.object({
  postId: z.string().min(1, "ID de publicación inválido"),
});

export type RegisterActivityInput = z.infer<typeof registerActivitySchema>;
export type UpdateProfileSettingsInput = z.infer<
  typeof updateProfileSettingsSchema
>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
export type LikePostInput = z.infer<typeof likePostSchema>;

export function getValidActivityType(value: string): (typeof ACTIVITY_TYPES)[number] {
  return ACTIVITY_TYPES.includes(value as (typeof ACTIVITY_TYPES)[number])
    ? (value as (typeof ACTIVITY_TYPES)[number])
    : "other";
}
