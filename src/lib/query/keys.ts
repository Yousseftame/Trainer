/**
 * Central query-key factory — keeps cache identity consistent across features.
 * Prefer narrow keys (by id / cursor) over dumping entire collections.
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    profile: (uid: string) => ["auth", "profile", uid] as const,
  },
  subscribers: {
    all: ["subscribers"] as const,
    list: (filters: Record<string, unknown>) => ["subscribers", "list", filters] as const,
    detail: (id: string) => ["subscribers", "detail", id] as const,
    registrationRequests: (filters: Record<string, unknown>) =>
      ["subscribers", "registration-requests", filters] as const,
  },
  packages: {
    all: ["packages"] as const,
    list: () => ["packages", "list"] as const,
    detail: (id: string) => ["packages", "detail", id] as const,
  },
  subscriptions: {
    all: ["subscriptions"] as const,
    bySubscriber: (subscriberId: string) =>
      ["subscriptions", "subscriber", subscriberId] as const,
    detail: (id: string) => ["subscriptions", "detail", id] as const,
  },
  workouts: {
    all: ["workouts"] as const,
    templates: (filters: Record<string, unknown>) =>
      ["workouts", "templates", filters] as const,
    assignment: (subscriberId: string) =>
      ["workouts", "assignment", subscriberId] as const,
  },
  nutrition: {
    all: ["nutrition"] as const,
    templates: (filters: Record<string, unknown>) =>
      ["nutrition", "templates", filters] as const,
    assignment: (subscriberId: string) =>
      ["nutrition", "assignment", subscriberId] as const,
  },
  content: {
    all: ["content"] as const,
    list: (filters: Record<string, unknown>) => ["content", "list", filters] as const,
    detail: (id: string) => ["content", "detail", id] as const,
  },
  progress: {
    all: ["progress"] as const,
    measurements: (subscriberId: string) =>
      ["progress", "measurements", subscriberId] as const,
    photos: (subscriberId: string) => ["progress", "photos", subscriberId] as const,
    workoutLogs: (subscriberId: string, filters: Record<string, unknown>) =>
      ["progress", "workout-logs", subscriberId, filters] as const,
    nutritionLogs: (subscriberId: string, filters: Record<string, unknown>) =>
      ["progress", "nutrition-logs", subscriberId, filters] as const,
  },
  reports: {
    all: ["reports"] as const,
    overview: () => ["reports", "overview"] as const,
  },
  staff: {
    all: ["staff"] as const,
    list: () => ["staff", "list"] as const,
  },
} as const
