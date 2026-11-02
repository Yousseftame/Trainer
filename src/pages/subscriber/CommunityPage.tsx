import { useState } from "react"
import {
  Flame,
  Heart,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
  UserCheck,
} from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type CommunityPost = {
  id: string
  authorName: string
  authorRole: "coach" | "subscriber"
  avatar?: string
  timeAgoAr: string
  timeAgoEn: string
  categoryAr: string
  categoryEn: string
  contentAr: string
  contentEn: string
  likes: number
  hasLiked?: boolean
  commentsCount: number
  pinned?: boolean
  badgeAr?: string
  badgeEn?: string
}

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    authorName: "Coach Omar Sherif",
    authorRole: "coach",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    timeAgoAr: "منذ ساعتين",
    timeAgoEn: "2 hours ago",
    categoryAr: "إعلان المدرب والتحدي الأسبوعي",
    categoryEn: "Coach Announcement & Weekly Challenge",
    contentAr:
      "صباح العزيمة والنشاط يا أبطال! 🔥 تحدي هذا الأسبوع: التركيز على جودة النزول البطيء (Tempo 3-0-1) في تمارين الأرجل، ولا تنسوا شرب 3.5 لتر ماء يومياً. شاركونا أوزانكم الجديدة في خانة التمارين!",
    contentEn:
      "Good morning champions! 🔥 This week's challenge: Focus on slow eccentric tempo (3-0-1) on leg movements, and make sure you hit 3.5L of water daily. Share your PR logs in the workout tab!",
    likes: 42,
    hasLiked: false,
    commentsCount: 9,
    pinned: true,
    badgeAr: "تحدي الأسبوع",
    badgeEn: "Weekly Challenge",
  },
  {
    id: "post-2",
    authorName: "Alex Haddad",
    authorRole: "subscriber",
    timeAgoAr: "منذ 4 ساعات",
    timeAgoEn: "4 hours ago",
    categoryAr: "إنجاز ورقم قياسي (PR)",
    categoryEn: "Personal Record (PR)",
    contentAr:
      "الحمد لله حققت اليوم 140 كجم في تمرين الديدليفت بعد 8 أسابيع من الالتزام بخطة Transform مع الكوتش! الاستمرارية هي السر 💪",
    contentEn:
      "Hit a 140kg deadlift PR today after 8 weeks on the Transform program with Coach Omar! Consistency pays off 💪",
    likes: 28,
    hasLiked: false,
    commentsCount: 6,
    badgeAr: "رقم قياسي جديد 🏆",
    badgeEn: "New PR 🏆",
  },
  {
    id: "post-3",
    authorName: "Sara Mostafa",
    authorRole: "subscriber",
    timeAgoAr: "منذ يوم واحد",
    timeAgoEn: "Yesterday",
    categoryAr: "تغذية وبدائل ذكية",
    categoryEn: "Nutrition & Healthy Swaps",
    contentAr:
      "جربت بديل دقيق الشوفان مع بياض البيض والقرفة من خطة التغذية اليوم وكان طعمه رائع جداً ومطابق لنسب الماكروز! أنصحكم بتجربته للفطور.",
    contentEn:
      "Tried the oat flour + egg white pancake recipe from the nutrition plan today — delicious and fit macros perfectly! Highly recommend for breakfast.",
    likes: 19,
    hasLiked: false,
    commentsCount: 4,
  },
]

export function CommunityPage() {
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  useDocumentTitle(isAr ? "مجتمع المشتركين والتحفيز" : "Subscriber Community")

  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS)
  const [newPostText, setNewPostText] = useState("")

  function handleToggleLike(postId: string) {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post
        const nextLiked = !post.hasLiked
        return {
          ...post,
          hasLiked: nextLiked,
          likes: nextLiked ? post.likes + 1 : post.likes - 1,
        }
      }),
    )
  }

  function handleCreatePost(e: React.FormEvent) {
    e.preventDefault()
    if (!newPostText.trim()) return

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: user?.displayName || (isAr ? "مشترك DerpyFit" : "DerpyFit Member"),
      authorRole: user?.role === "subscriber" ? "subscriber" : "coach",
      timeAgoAr: "الآن",
      timeAgoEn: "Just now",
      categoryAr: "مشاركة مشترِك",
      categoryEn: "Member Post",
      contentAr: newPostText.trim(),
      contentEn: newPostText.trim(),
      likes: 1,
      hasLiked: true,
      commentsCount: 0,
      badgeAr: isAr ? "عضو نشط" : "Active Member",
      badgeEn: "Active Member",
    }

    setPosts([newPost, ...posts])
    setNewPostText("")
    appToast.success(
      isAr ? "تم نشر مشاركتك في مجتمع المشتركين!" : "Your post has been published!",
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6 pb-28">
      {/* Community Header Banner */}
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--gym-ink,#111111)] p-6 text-white sm:p-7 shadow-lg">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gym-lime,#fb5001)]/20 px-3 py-1 text-[11px] font-bold text-[var(--gym-lime,#fb5001)]">
              <Sparkles className="size-3.5" />
              <span>{isAr ? "مجتمع DerpyFit الحصري" : "Exclusive DerpyFit Community"}</span>
            </span>
            <h2 className="font-heading text-xl font-extrabold sm:text-2xl text-white">
              {isAr ? "شارك إنجازاتك وحفّز زملاءك 🚀" : "Share your wins & stay motivated 🚀"}
            </h2>
            <p className="text-[13px] font-medium text-white/70 max-w-xl">
              {isAr
                ? "مساحتك الخاصة لمتابعة توجيهات المدرب عمر، مشاركة أرقامك القياسية، والتواصل مع المشتركين الآخرين."
                : "Your private space to follow Coach Omar's announcements, log PRs, and connect with fellow members."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#fb5001] text-[10px] font-bold text-white ring-2 ring-[var(--gym-ink,#111111)]">
                OS
              </span>
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#3b82f6] text-[10px] font-bold text-white ring-2 ring-[var(--gym-ink,#111111)]">
                AH
              </span>
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#10b981] text-[10px] font-bold text-white ring-2 ring-[var(--gym-ink,#111111)]">
                SM
              </span>
            </div>
            <span className="text-[12px] font-bold text-white/80">
              {isAr ? "+50 بطل نشط" : "+50 Active"}
            </span>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="pointer-events-none absolute -bottom-10 -end-10 size-48 rounded-full bg-[var(--gym-lime,#fb5001)]/10 blur-3xl" />
      </div>

      {/* Share a post box */}
      <form
        onSubmit={handleCreatePost}
        className="rounded-[24px] border border-black/8 bg-white p-4 sm:p-5 shadow-sm"
      >
        <div className="flex gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] font-heading text-[13px] font-bold text-[var(--gym-lime,#fb5001)]">
            {initials(user?.displayName || "Member")}
          </span>
          <div className="flex-1">
            <textarea
              rows={2}
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder={
                isAr
                  ? "شارك فكرة، استفساراً، أو إنجازاً جديداً مع المدرب والمشتركين..."
                  : "Share a thought, question, or new PR with the coach and members..."
              }
              className="w-full resize-none rounded-2xl bg-[#F8F8F8] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none transition placeholder:text-[#8c8c8c] focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]"
            />
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8c8c8c]">
                {isAr ? "مجتمع تدريبي إيجابي وداعم" : "Positive & supportive fitness feed"}
              </span>
              <button
                type="submit"
                disabled={!newPostText.trim()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[12px] font-bold text-white transition hover:opacity-95 disabled:opacity-40"
              >
                <span>{isAr ? "نشر المشاركة" : "Post"}</span>
                <Send className="size-3.5 rtl:-scale-x-100" />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Posts Feed */}
      <div className="flex flex-col gap-4">
        {posts.map((post) => {
          const isCoach = post.authorRole === "coach"
          return (
            <article
              key={post.id}
              className={cn(
                "rounded-[26px] border p-5 transition sm:p-6 shadow-sm",
                post.pinned
                  ? "border-[var(--gym-lime,#fb5001)]/30 bg-gradient-to-br from-[#FFFBF9] to-white"
                  : "border-black/6 bg-white",
              )}
            >
              {/* Post Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {post.avatar ? (
                    <img
                      src={post.avatar}
                      alt={post.authorName}
                      className="size-11 rounded-2xl object-cover ring-1 ring-black/10"
                    />
                  ) : (
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] font-heading text-[13px] font-bold text-[var(--gym-lime,#fb5001)]">
                      {initials(post.authorName)}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading text-[15px] font-bold text-[var(--gym-ink,#111111)]">
                        {post.authorName}
                      </h3>
                      {isCoach ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gym-lime,#fb5001)] px-2.5 py-0.5 text-[10px] font-bold text-white">
                          <UserCheck className="size-3" />
                          <span>{isAr ? "المدرب" : "Head Coach"}</span>
                        </span>
                      ) : null}
                      {post.badgeAr ? (
                        <span className="rounded-full bg-[#F4F4F4] px-2.5 py-0.5 text-[10px] font-bold text-[#6B7280]">
                          {isAr ? post.badgeAr : post.badgeEn}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#8c8c8c]">
                      <span>{isAr ? post.timeAgoAr : post.timeAgoEn}</span>
                      <span>•</span>
                      <span className="text-[var(--gym-lime,#fb5001)] font-bold">
                        {isAr ? post.categoryAr : post.categoryEn}
                      </span>
                    </div>
                  </div>
                </div>

                {post.pinned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gym-lime,#fb5001)]/15 px-2.5 py-1 text-[11px] font-bold text-[var(--gym-lime,#fb5001)]">
                    <Flame className="size-3.5 fill-[var(--gym-lime,#fb5001)]" />
                    <span>{isAr ? "مثبّت" : "Pinned"}</span>
                  </span>
                ) : null}
              </div>

              {/* Post Body */}
              <p className="mt-3.5 text-[14px] leading-relaxed text-[var(--gym-ink,#111111)] whitespace-pre-line">
                {isAr ? post.contentAr : post.contentEn}
              </p>

              {/* Post Actions footer */}
              <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition",
                      post.hasLiked
                        ? "bg-[#FFE8E4] text-[#fb5001]"
                        : "bg-[#F4F4F4] text-[#6B7280] hover:bg-black/5",
                    )}
                  >
                    <Heart
                      className={cn("size-3.5", post.hasLiked && "fill-[#fb5001]")}
                    />
                    <span>{post.likes}</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3 py-1.5 text-[12px] font-bold text-[#6B7280] transition hover:bg-black/5"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>{post.commentsCount}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(window.location.href)
                    appToast.success(isAr ? "تم نسخ الرابط" : "Link copied")
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8c8c8c] hover:text-[var(--gym-ink,#111111)]"
                >
                  <Share2 className="size-3.5" />
                  <span>{isAr ? "مشاركة" : "Share"}</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
