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
    moduleId: "overview",
    title: { en: "Overview Dashboard", ar: "لوحة النظرة العامة" },
    description: {
      en: "Admin home at /admin — studio snapshot, attention queue, and quick actions.",
      ar: "الصفحة الرئيسية للإدارة في /admin — ملخص الاستوديو وقائمة الانتباه والإجراءات السريعة.",
    },
    pageRoute: "/admin",
    permissions: [
      {
        key: "overview:read",
        label: { en: "View Overview", ar: "عرض النظرة العامة" },
        description: {
          en: "Show the Overview item in the sidebar and open the /admin home dashboard.",
          ar: "إظهار عنصر النظرة العامة في الشريط الجانبي وفتح لوحة /admin الرئيسية.",
        },
      },
    ],
  },
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
        label: { en: "View only", ar: "عرض فقط" },
        description: {
          en: "Browse the directory and open profiles. No add, edit, suspend, or delete.",
          ar: "تصفح الدليل وفتح الملفات فقط — بدون إضافة أو تعديل أو تعليق أو حذف.",
        },
      },
      {
        key: "subscribers:write",
        label: { en: "Add & edit", ar: "إضافة وتعديل" },
        description: {
          en: "Add subscribers, edit profiles, coach notes, suspend/activate, and delete.",
          ar: "إضافة مشتركين، تعديل الملفات والملاحظات، التعليق/التفعيل، والحذف.",
        },
      },
      {
        key: "subscribers:approve",
        label: { en: "Approve registrations", ar: "اعتماد طلبات التسجيل" },
        description: {
          en: "Open Registration Requests and approve, reject, or create manual leads.",
          ar: "فتح طلبات التسجيل واعتمادها أو رفضها أو إنشاء طلب يدوي.",
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
        label: { en: "Manage packages", ar: "إدارة الباقات" },
        description: {
          en: "Full package catalog control: create, edit pricing, and archive.",
          ar: "تحكم كامل بالباقات: إنشاء وتعديل الأسعار والأرشفة.",
        },
      },
      {
        key: "subscriptions:manage",
        label: { en: "Manage subscriptions", ar: "إدارة الاشتراكات" },
        description: {
          en: "Assign packages, renew/suspend seats, and resolve package-change requests.",
          ar: "تعيين الباقات، تجديد/تعليق المقاعد، ومعالجة طلبات تغيير الباقة.",
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
        key: "workouts:read",
        label: { en: "View only", ar: "عرض فقط" },
        description: {
          en: "Browse templates and assigned programs. No create, edit, assign, or delete.",
          ar: "تصفح القوالب والبرامج المعيّنة — بدون إنشاء أو تعديل أو تعيين أو حذف.",
        },
      },
      {
        key: "workouts:manage",
        label: { en: "Add & edit", ar: "إضافة وتعديل" },
        description: {
          en: "Create templates, assign programs, edit, archive, and delete.",
          ar: "إنشاء القوالب، تعيين البرامج، التعديل، الأرشفة، والحذف.",
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
        key: "nutrition:read",
        label: { en: "View only", ar: "عرض فقط" },
        description: {
          en: "Browse meal templates and assigned plans. No create, edit, assign, or delete.",
          ar: "تصفح قوالب الوجبات والخطط المعيّنة — بدون إنشاء أو تعديل أو تعيين أو حذف.",
        },
      },
      {
        key: "nutrition:manage",
        label: { en: "Add & edit", ar: "إضافة وتعديل" },
        description: {
          en: "Create plans, assign to subscribers, edit, archive, and delete.",
          ar: "إنشاء الخطط، تعيينها للمشتركين، التعديل، الأرشفة، والحذف.",
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
        label: { en: "View only", ar: "عرض فقط" },
        description: {
          en: "Review injury assessments and restrictions. No create, edit, or delete.",
          ar: "مراجعة تقييمات الإصابات والقيود — بدون إنشاء أو تعديل أو حذف.",
        },
      },
      {
        key: "physicalTherapy:manage",
        label: { en: "Add & edit", ar: "إضافة وتعديل" },
        description: {
          en: "Create assessments, edit rehab plans, mark cleared, and delete records.",
          ar: "إنشاء تقييمات، تعديل خطط التأهيل، تسجيل التعافي، وحذف السجلات.",
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
        key: "content:read",
        label: { en: "View only", ar: "عرض فقط" },
        description: {
          en: "Browse and preview library assets. No upload, edit, or delete.",
          ar: "تصفح ومعاينة أصول المكتبة — بدون رفع أو تعديل أو حذف.",
        },
      },
      {
        key: "content:manage",
        label: { en: "Add & edit", ar: "إضافة وتعديل" },
        description: {
          en: "Upload, edit, link assets to exercises, and delete content.",
          ar: "رفع المحتوى وتعديله وربطه بالتمارين وحذفه.",
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
        label: { en: "View only", ar: "عرض فقط" },
        description: {
          en: "Review weigh-ins, photos, and adherence. No add or delete.",
          ar: "مراجعة القياسات والصور والالتزام — بدون إضافة أو حذف.",
        },
      },
      {
        key: "progress:write",
        label: { en: "Add & edit", ar: "إضافة وتعديل" },
        description: {
          en: "Log check-ins, upload photos, add performance records, and delete entries.",
          ar: "تسجيل القياسات، رفع الصور، إضافة سجلات الأداء، وحذف الإدخالات.",
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
        label: { en: "View only", ar: "عرض فقط" },
        description: {
          en: "Open Reports inbox and analytics tabs. Does not unlock Overview (use Overview Dashboard).",
          ar: "فتح صندوق التقارير وتبويبات التحليلات. لا يفتح النظرة العامة (استخدم لوحة النظرة العامة).",
        },
      },
      {
        key: "reports:export",
        label: { en: "Export data", ar: "تصدير البيانات" },
        description: {
          en: "Download CSV exports for rosters, revenue, and adherence.",
          ar: "تنزيل ملفات CSV للمشتركين والإيرادات والالتزام.",
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
      en: "Controls the Send / Retry buttons inside Reports — not a separate page.",
      ar: "يتحكم في أزرار الإرسال/إعادة المحاولة داخل التقارير — وليست صفحة منفصلة.",
    },
    pageRoute: "/admin/reports",
    permissions: [
      {
        key: "notifications:send",
        label: { en: "Send / retry notices", ar: "إرسال / إعادة محاولة الإشعارات" },
        description: {
          en: "From Reports inbox: manually send or retry email/push notices (registration, expiry, package-change, etc.). Viewing Reports still needs View Reports.",
          ar: "من صندوق التقارير: إرسال أو إعادة محاولة إشعارات البريد/الدفع يدوياً (تسجيل، انتهاء، تغيير باقة…). عرض التقارير ما زال يحتاج صلاحية عرض التقارير.",
        },
      },
    ],
  },
]

