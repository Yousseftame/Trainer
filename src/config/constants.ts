/** App-wide constants — keep magic values out of feature code. */

export const APP_ROUTES = {
  public: {
    home: "/",
    about: "/about",
    services: "/services",
    register: "/register",
    login: "/login",
    contact: "/contact",
  },
  admin: {
    root: "/admin",
    overview: "/admin",
    subscribers: "/admin/subscribers",
    subscriberDetail: (id: string) => `/admin/subscribers/${id}`,
    registrationRequests: "/admin/registration-requests",
    packages: "/admin/packages",
    subscriptions: "/admin/subscriptions",
    workouts: "/admin/workouts",
    nutrition: "/admin/nutrition",
    content: "/admin/content",
    progress: "/admin/progress",
    staff: "/admin/staff",
    reports: "/admin/reports",
  },
  subscriber: {
    root: "/app",
    overview: "/app",
    profile: "/app/profile",
    subscription: "/app/subscription",
    workout: "/app/workout",
    nutrition: "/app/nutrition",
    library: "/app/library",
    workoutLog: "/app/workout-log",
    nutritionLog: "/app/nutrition-log",
    progress: "/app/progress",
    history: "/app/history",
  },
  errors: {
    unauthorized: "/unauthorized",
    subscriptionExpired: "/subscription-expired",
  },
} as const

export const QUERY_STALE_TIMES = {
  /** Auth profile / claims — short, security-sensitive */
  authProfile: 30_000,
  /** Admin lists — balance freshness vs Firestore reads */
  adminList: 60_000,
  /** Subscriber own dashboard data */
  subscriberDashboard: 45_000,
  /** Relatively static catalogs (packages, templates metadata) */
  catalog: 5 * 60_000,
} as const

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 50,
} as const

export const DEVICE_SESSION = {
  maxActiveDevices: 2,
} as const
