import type { Permission } from "@/lib/permissions/permissions"
import type { Role } from "@/lib/permissions/roles"

export type StaffRole = Exclude<Role, "subscriber">

export type StaffStatus = "active" | "suspended"

export type StaffMember = {
  id: string
  displayName: string
  email: string
  phone?: string
  role: StaffRole
  status: StaffStatus
  permissions: Permission[]
  customTitle?: {
    en: string
    ar: string
  }
  notes?: string
  avatarUrl?: string
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

export type PermissionModuleGroup = {
  moduleId: string
  title: {
    en: string
    ar: string
  }
  description: {
    en: string
    ar: string
  }
  pageRoute: string
  permissions: Array<{
    key: Permission
    label: {
      en: string
      ar: string
    }
    description: {
      en: string
      ar: string
    }
  }>
}

export const PERMISSION_MODULES: PermissionModuleGroup[] = [
  {
    moduleId: "subscribers",
    title: { en: "Subscribers & Registrations", ar: "المشتركون وطلبات التسجيل" },
    description: {
      en: "Client profiles, contact info, onboarding, and registration approvals.",
      ar: "ملفات العملاء، بيانات الاتصال، واعتماد أو رفض طلبات التسجيل.",
    },
    pageRoute: "/admin/subscribers",
    permissions: [
      {
        key: "subscribers:read",
        label: { en: "View Subscribers", ar: "عرض قائمة وملفات المشتركين" },
        description: {
          en: "Browse the subscriber directory and view client details.",
          ar: "تصفح دليل المشتركين والاطلاع على تفاصيل الحسابات.",
        },
      },
      {
        key: "subscribers:write",
        label: { en: "Edit Subscribers", ar: "إضافة وتعديل بيانات المشتركين" },
        description: {
          en: "Create, update profiles, and write private coach notes.",
          ar: "إنشاء حسابات جديدة وتحديث البيانات وكتابة ملاحظات المدرب.",
        },
      },
      {
        key: "subscribers:approve",
        label: { en: "Approve Registrations", ar: "مراجعة واعتماد طلبات التسجيل" },
        description: {
          en: "Approve or decline prospective subscriber requests.",
          ar: "اتخاذ قرار القبول أو الرفض للطلبات الواردة.",
        },
      },
    ],
  },
  {
    moduleId: "billing",
    title: { en: "Packages & Subscriptions", ar: "الباقات والاشتراكات" },
    description: {
      en: "Plans pricing, duration, seat assignments, and renewals.",
      ar: "إدارة أسعار الباقات، مدد الاشتراك، والتجديدات والتعليق.",
    },
    pageRoute: "/admin/packages",
    permissions: [
      {
        key: "packages:manage",
        label: { en: "Manage Packages", ar: "إدارة وإنشاء الباقات" },
        description: {
          en: "Create, edit pricing, and archive subscription packages.",
          ar: "إنشاء باقات جديدة وتعديل المزايا والأسعار والأرشفة.",
        },
      },
      {
        key: "subscriptions:manage",
        label: { en: "Manage Subscriptions", ar: "إدارة اشتراكات العملاء" },
        description: {
          en: "Assign packages, renew expired seats, and handle cancellations.",
          ar: "تعيين الباقات للعملاء وتجديد المقاعد المنتهية أو تعليقها.",
        },
      },
    ],
  },
  {
    moduleId: "workouts",
    title: { en: "Workout Programs", ar: "البرامج والتمارين الرياضية" },
    description: {
      en: "Routine design, exercises, sets/reps, and equipment alternatives.",
      ar: "تصميم جداول التمارين، الجولات والتكرارات، وبدائل الأجهزة.",
    },
    pageRoute: "/admin/workouts",
    permissions: [
      {
        key: "workouts:manage",
        label: { en: "Manage Workout Programs", ar: "إدارة وتعيين برامج التمارين" },
        description: {
          en: "Create workout templates, assign custom routines, and set alternatives.",
          ar: "إنشاء قوالب التمارين، وتخصيص الجداول وإضافة بدائل التمارين.",
        },
      },
    ],
  },
  {
    moduleId: "nutrition",
    title: { en: "Nutrition Plans", ar: "الخطط والأنظمة الغذائية" },
    description: {
      en: "Meal plans, food items, macro targets, and substitution options.",
      ar: "إعداد الوجبات، السعرات والماكروز، وبدائل الأغذية المقترحة.",
    },
    pageRoute: "/admin/nutrition",
    permissions: [
      {
        key: "nutrition:manage",
        label: { en: "Manage Nutrition Plans", ar: "إدارة وتعيين خطط التغذية" },
        description: {
          en: "Create meal templates, calculate macros, and assign food alternatives.",
          ar: "تصميم قوالب الوجبات، توزيع الماكروز، وتحديد بدائل الأطعمة.",
        },
      },
    ],
  },
  {
    moduleId: "physicalTherapy",
    title: { en: "Physical Therapy & Rehab", ar: "العلاج الطبيعي والتأهيل" },
    description: {
      en: "Injury diagnosis, movement restrictions, and rehab exercises.",
      ar: "تشخيص الإصابات، موانع الحركة في الجيم، وتمارين التأهيل والاستشفاء.",
    },
    pageRoute: "/admin/physical-therapy",
    permissions: [
      {
        key: "physicalTherapy:read",
        label: { en: "View PT & Injury Records", ar: "الاطلاع على ملفات التأهيل والإصابات" },
        description: {
          en: "Review subscriber injury assessments and movement contraindications.",
          ar: "الاطلاع على تشخيصات الإصابات وموانع الحركة للمشتركين.",
        },
      },
      {
        key: "physicalTherapy:manage",
        label: { en: "Manage PT & Rehab Records", ar: "إدارة تقييمات وتمارين التأهيل" },
        description: {
          en: "Create injury profiles, prescribe safe gym substitutes, and log rehab routines.",
          ar: "تسجيل حالات جديدة، تحديد بدائل التمارين الآمنة، ووصف تمارين التأهيل.",
        },
      },
    ],
  },
  {
    moduleId: "content",
    title: { en: "Content & Video Library", ar: "مكتبة المحتوى والوسائط" },
    description: {
      en: "Instructional exercise videos, guides, and educational materials.",
      ar: "فيديوهات شرح التمارين، الكتيبات الإرشادية، والمستندات التعليمية.",
    },
    pageRoute: "/admin/content",
    permissions: [
      {
        key: "content:manage",
        label: { en: "Manage Content Library", ar: "إدارة ورفع المحتوى التعليمي" },
        description: {
          en: "Upload, associate videos with exercises, and assign documents.",
          ar: "رفع وتصنيف الفيديوهات وربطها بالتمارين وتخصيص الكتيبات.",
        },
      },
    ],
  },
  {
    moduleId: "progress",
    title: { en: "Progress & Adherence", ar: "تتبع التقدم والقياسات" },
    description: {
      en: "Body weights, circumferences, progress photos, and PR lifts.",
      ar: "أوزان الجسم، المقاسات، صور التطور الدورية، وأرقام الأداء الرياضي.",
    },
    pageRoute: "/admin/progress",
    permissions: [
      {
        key: "progress:read",
        label: { en: "Access Subscriber Progress", ar: "الاطلاع على تقدم المشتركين" },
        description: {
          en: "Inspect private weigh-in charts, photos, and compliance history.",
          ar: "متابعة سجلات الوزن ونسب الالتزام والصور الشخصية للمشترك.",
        },
      },
      {
        key: "progress:write",
        label: { en: "Edit Subscriber Progress", ar: "تعديل تقدم المشتركين" },
        description: {
          en: "Add or delete measurements, progress photos, and performance records for any subscriber.",
          ar: "إضافة أو حذف القياسات وصور التطور وسجلات الأداء لأي مشترك.",
        },
      },
    ],
  },
  {
    moduleId: "reports",
    title: { en: "Reports & Analytics", ar: "التقارير والتحليلات" },
    description: {
      en: "Studio operations, weekly digests, and client retention trends.",
      ar: "ملخص النشاط الأسبوعي، معدلات الاستمرارية، وتقارير الأعمال.",
    },
    pageRoute: "/admin/reports",
    permissions: [
      {
        key: "reports:read",
        label: { en: "View Reports", ar: "الاطلاع على التقارير" },
        description: {
          en: "Access weekly pulse, check-in summaries, and revenue metrics.",
          ar: "قراءة نبض الاستوديو الأسبوعي وتقارير المتابعة والتجديدات.",
        },
      },
      {
        key: "reports:export",
        label: { en: "Export Reports", ar: "تصدير البيانات والتقارير" },
        description: {
          en: "Export subscriber rosters, revenue figures, and adherence sheets.",
          ar: "تنزيل وتصدير البيانات الإحصائية وسجلات المشتركين.",
        },
      },
    ],
  },
  {
    moduleId: "staff",
    title: { en: "Staff & Team Permissions", ar: "الموظفون والصلاحيات الإدارية" },
    description: {
      en: "Administrative staff accounts, role assignment, and access control.",
      ar: "إدارة حسابات فريق العمل، توزيع الصلاحيات، وحظر الحسابات.",
    },
    pageRoute: "/admin/staff",
    permissions: [
      {
        key: "staff:manage",
        label: { en: "Manage Staff & Roles", ar: "إدارة فريق العمل والصلاحيات" },
        description: {
          en: "Invite, update roles, suspend, or delete administrative accounts.",
          ar: "إنشاء حسابات الموظفين، تحديد الصلاحيات، وحظر أو حذف الحسابات.",
        },
      },
    ],
  },
  {
    moduleId: "notifications",
    title: { en: "Notifications & Messages", ar: "الإشعارات والرسائل" },
    description: {
      en: "Broadcast announcements and transactional reminders to subscribers.",
      ar: "إرسال التنبيهات المباشرة وتذكيرات التجديد والتمرين للعملاء.",
    },
    pageRoute: "/admin/overview",
    permissions: [
      {
        key: "notifications:send",
        label: { en: "Send Notifications", ar: "إرسال الإشعارات والتعميمات" },
        description: {
          en: "Dispatch push notifications and in-app system messages.",
          ar: "إرسال رسائل التنبيه الفورية وإشعارات النظام إلى المشتركين.",
        },
      },
    ],
  },
]

