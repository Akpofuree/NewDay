"use client"

import { cn } from "../../lib/utils"

const reviews = [
  {
    name: "Chinedu",
    username: "@chinedu_dev",
    body: "The AI chatbox is incredible! It helped me break down complex projects into manageable tasks. My productivity has doubled since I started using NewDay.",
    img: "https://avatar.vercel.sh/chinedu",
  },
  {
    name: "Amaka",
    username: "@amaka_design",
    body: "Group task features are exactly what my design team needed. We can now collaborate in real-time without switching between multiple apps. Absolutely love it!",
    img: "https://avatar.vercel.sh/amaka",
  },
  {
    name: "Emeka",
    username: "@emeka_tech",
    body: "I've tried dozens of task managers, but NewDay's AI-powered suggestions are game-changing. It actually learns from my work patterns and suggests relevant tasks.",
    img: "https://avatar.vercel.sh/emeka",
  },
  {
    name: "Ngozi",
    username: "@ngozi_pm",
    body: "The productivity features are unmatched. Time tracking, focus mode, and smart prioritization have transformed how my team manages deadlines.",
    img: "https://avatar.vercel.sh/ngozi",
  },
  {
    name: "Oluwaseun",
    username: "@seun_eng",
    body: "Real-time collaboration is seamless. My engineering team can coordinate on complex projects with zero lag. The sync speed is impressive.",
    img: "https://avatar.vercel.sh/seun",
  },
  {
    name: "Adaeze",
    username: "@adaeze_marketing",
    body: "The AI chatbox understands context like no other tool. It helps me organize marketing campaigns and track deliverables effortlessly. Best investment!",
    img: "https://avatar.vercel.sh/adaeze",
  },
  {
    name: "Ifeanyi",
    username: "@ifeanyi_ops",
    body: "Group task management has never been this intuitive. We can assign, track, and complete tasks as a team with complete visibility. Highly recommended!",
    img: "https://avatar.vercel.sh/ifeanyi",
  },
  {
    name: "Chioma",
    username: "@chioma_hr",
    body: "NewDay's productivity features helped our HR team streamline recruitment workflows. The AI suggestions are surprisingly accurate and helpful.",
    img: "https://avatar.vercel.sh/chioma",
  },
]

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string
  name: string
  username: string
  body: string
}) => {
  return (
    <figure
      className={cn(
        "relative h-full min-h-[210px] overflow-hidden rounded-2xl border p-5",
        "border-gray-200 bg-white/85 shadow-lg shadow-slate-900/5 hover:-translate-y-1 hover:border-[#5C27FE]/30",
        "dark:border-white/10 dark:bg-white/[.06] dark:shadow-black/20 dark:hover:bg-white/[.09]",
        "transition-all duration-300"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {body}
      </blockquote>
    </figure>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
      <div className="text-center mb-10">
        <h2 className="text-xs font-bold text-[#5C27FE] dark:text-[#a085ff] uppercase tracking-widest mb-1.5 font-mono">
          User Testimonials
        </h2>
        <p className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
          Loved by teams across Nigeria
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-2">
          See what our users say about NewDay's AI chatbox, group task features, and productivity tools.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reviews.slice(0, 4).map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </div>
    </section>
  )
}
