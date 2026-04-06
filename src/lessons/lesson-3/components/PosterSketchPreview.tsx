/**
 * 文件说明：课时3「校园科普海报草图」预览组件
 * 职责：夜空主标题区展示占位提示（引导学生起名与补充说明）；小组真实探究问题仅在「探究问题」卡片内展示。
 * 更新触发：夜空固定文案、分区内容、版式或重点卡片高亮（含光晕动画与 prefers-reduced-motion）调整时；
 *           新增 spotlight / whyBodyOverride / embedded 等预览模式时
 *
 * 字体：Cormorant Garamond + Noto Serif SC（@fontsource 本地打包，与先前 Google Fonts 组合一致）。
 */

import { type LucideIcon, Eye, Lightbulb, Link2, Lock, Microscope } from "lucide-react"

import "@fontsource/cormorant-garamond/500.css"
import "@fontsource/cormorant-garamond/600.css"
import "@fontsource/cormorant-garamond/700.css"
import "@fontsource/noto-serif-sc/chinese-simplified-500.css"
import "@fontsource/noto-serif-sc/chinese-simplified-600.css"

/** 夜空区主行占位提示（非档案课题标题） */
const POSTER_HERO_TITLE = "标题：请你给你的探究起个名字"
/** 夜空区副行占位提示（说明探究侧重哪一方面） */
const POSTER_HERO_SUBTITLE = "副标题：用于说明具体哪方面的探究"

/** 聚光灯目标：高亮该区块，其余区域罩半透明深色（用于第2关等「定位到海报哪一格」） */
export type PosterSpotlightCard = "question" | "why" | "evidence" | "clue"

export interface PosterSketchPreviewProps {
  /** 小组完整研究问题（课时1），仅展示在「探究问题」分区正文 */
  researchQuestion?: string | null
  /** 课时2 个人资料条数 */
  evidenceEntryCount?: number
  /** 嵌入对话框等场景时去掉 sticky / 收窄外层布局 */
  embedded?: boolean
  /** 非 null 时仅高亮对应卡片，其它区块（含夜空标题区）加半透明黑罩 */
  spotlightCard?: PosterSpotlightCard | null
  /** 覆盖「为何关注」卡片正文（第2关预览用户草稿；空则仍用默认引导文案） */
  whyBodyOverride?: string | null
}

/** 右上角黄色胶带装饰 */
function TapeCornerTR() {
  return (
    <div
      className="pointer-events-none absolute -right-1 top-2 z-20 h-7 w-14 rotate-[18deg] rounded-[2px] bg-gradient-to-br from-amber-200/95 to-amber-300/90 shadow-[2px_2px_4px_rgba(0,0,0,0.15)]"
      aria-hidden
    />
  )
}

/** 夜空下的建筑剪影 + 路面（极简 SVG） */
function NightCitySilhouette() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 h-14 w-full text-slate-900/85"
      viewBox="0 0 320 56"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect x="0" y="38" width="320" height="18" fill="currentColor" opacity="0.35" />
      <path
        fill="currentColor"
        d="M0 38 L0 22 L18 22 L18 14 L32 14 L32 22 L48 22 L48 10 L62 10 L62 22 L78 22 L78 16 L94 16 L94 22 L112 22 L112 8 L128 8 L128 22 L148 22 L148 12 L168 12 L168 22 L188 22 L188 18 L204 18 L204 22 L224 22 L224 6 L242 6 L242 22 L262 22 L262 14 L278 14 L278 22 L296 22 L296 20 L320 20 L320 38 Z"
        opacity="0.9"
      />
      {/* 零星亮窗 */}
      <rect x="52" y="18" width="3" height="3" fill="#fde68a" opacity="0.9" />
      <rect x="118" y="12" width="3" height="3" fill="#fde68a" opacity="0.85" />
      <rect x="230" y="10" width="3" height="3" fill="#fde68a" opacity="0.9" />
      <rect x="172" y="16" width="2" height="2" fill="#fef3c7" opacity="0.8" />
      {/* 路面虚线感 */}
      <line x1="0" y1="47" x2="320" y2="47" stroke="white" strokeWidth="1" strokeDasharray="6 5" opacity="0.25" />
    </svg>
  )
}

export function PosterSketchPreview({
  researchQuestion,
  evidenceEntryCount = 0,
  embedded = false,
  spotlightCard = null,
  whyBodyOverride,
}: PosterSketchPreviewProps) {
  const q = researchQuestion?.trim()

  const block1Body = q
    ? q
    : "小组共识确定后，我们会把最想弄清楚的疑问写在这里——像海报主标题一样醒目。"

  const whyDraft = whyBodyOverride?.trim()
  const block2Body = whyDraft
    ? whyDraft
    : spotlightCard === "why"
      ? "（尚未填写）请先在上一屏「海报上的『为何关注』我可以这样写」中输入，保存后会显示在本格。"
      : "前期收集的辅助材料里，藏着「为什么在意」的理由。本课要把它们收成一两句，贴在海报上也能一眼读懂。"

  const block3Body =
    evidenceEntryCount > 0
      ? `你在课时2记下的 ${evidenceEntryCount} 条资料，会在本课里挑一挑、理一理，变成展板上「我们看见了什么」的证据卡。`
      : "课时2里记下的观察与资料，会在本课筛选、加工，变成海报上亮出来的「我们看见了什么」。"

  const block4Body = "这一格先留白。下节课小组把资料并在一起后，再一起讨论「可能的线索」该怎么写。"

  const dimForWhy = spotlightCard === "why"
  const shellClass = embedded
    ? "w-full max-w-md mx-auto font-poster-display"
    : "w-full max-w-md mx-auto lg:max-w-none lg:w-full lg:sticky lg:top-24 lg:self-start font-poster-display"

  return (
    <aside className={shellClass} aria-label="主题探究海报草图预览">
      {/* 整体：米色画板 + 轻投影，像钉在墙上的作品 */}
      <div className="relative rounded-3xl border border-stone-300/70 bg-[#ebe4d8] p-3 shadow-[0_8px_30px_-6px_rgba(60,48,40,0.18)] sm:p-3.5">
        {/* 夜空主标题区 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1e3a5f] via-[#152a45] to-[#0f1f33] px-4 pb-12 pt-5 sm:px-5 sm:pb-14 sm:pt-6">
          {/* 星星点 */}
          <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
            <span className="absolute left-[12%] top-[18%] h-0.5 w-0.5 rounded-full bg-white" />
            <span className="absolute left-[22%] top-[28%] h-0.5 w-0.5 rounded-full bg-white" />
            <span className="absolute right-[30%] top-[22%] h-1 w-1 rounded-full bg-white/80" />
            <span className="absolute right-[14%] top-[35%] h-0.5 w-0.5 rounded-full bg-white" />
          </div>

          <TapeCornerTR />

          {/* 月亮 */}
          <div
            className="pointer-events-none absolute right-[18%] top-[12%] h-6 w-6 rounded-full bg-amber-200/95 shadow-[inset_-4px_-2px_0_rgba(251,191,36,0.4)] sm:h-7 sm:w-7"
            aria-hidden
          />

          <div className="absolute left-3 top-3 z-10 max-w-[48%] text-left sm:left-4 sm:top-4">
            <p className="text-xs font-bold leading-tight text-amber-200 sm:text-sm">主题探究海报（草图）</p>
          </div>

          <div className="relative z-[5] mx-auto mt-10 max-w-[95%] text-center sm:mt-11">
            <h2 className="text-lg font-semibold leading-snug tracking-wide text-white drop-shadow-sm sm:text-xl sm:tracking-[0.02em]">
              {POSTER_HERO_TITLE}
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed tracking-wide text-white/90 sm:text-sm">
              {POSTER_HERO_SUBTITLE}
            </p>
          </div>

          <NightCitySilhouette />
          {dimForWhy ? (
            <div
              className="pointer-events-none absolute inset-0 z-30 rounded-2xl bg-black/50"
              aria-hidden
            />
          ) : null}
        </div>

        {/* 四张分区卡片：细实线描边 + 柔和填色 */}
        <div className="mt-3 flex flex-col gap-2.5 sm:gap-3">
          <SketchCard
            icon={Microscope}
            title="探究问题"
            statusLabel="已自动带入"
            tone="blue"
            body={block1Body}
            foot="来源：课时1 小组共识"
            dimmed={dimForWhy}
          />
          <SketchCard
            icon={Lightbulb}
            title="为何关注"
            statusLabel="本课加工"
            tone="tan"
            body={block2Body}
            foot="处理位置：课时3 后续步骤"
            dimmed={false}
            spotlight={dimForWhy}
          />
          <SketchCard
            icon={Eye}
            title="我们看见了什么"
            statusLabel="本课筛选 + 加工"
            tone="green"
            body={block3Body}
            foot="来源：课时2 个人记录"
            dimmed={dimForWhy}
          />
          <SketchCard
            icon={Link2}
            title="可能的线索"
            statusLabel="锁定"
            tone="purple"
            body={block4Body}
            foot="下节课由组长汇总后解锁"
            locked
            dimmed={dimForWhy}
          />
        </div>
      </div>
    </aside>
  )
}

function SketchCard({
  icon: Icon,
  title,
  statusLabel,
  tone,
  body,
  foot,
  locked,
  dimmed,
  spotlight,
}: {
  icon: LucideIcon
  title: string
  statusLabel: string
  tone: "blue" | "tan" | "green" | "purple"
  body: string
  foot: string
  locked?: boolean
  /** 半透明黑罩（聚光灯模式下非主角卡片） */
  dimmed?: boolean
  /** 聚光灯主角：提高层级并加描边 */
  spotlight?: boolean
}) {
  const borderBg =
    tone === "blue"
      ? "border-sky-400/70 bg-sky-50/90"
      : tone === "tan"
        ? "border-amber-300/80 bg-[#faf6ed]"
        : tone === "green"
          ? "border-emerald-400/65 bg-emerald-50/90"
          : "border-violet-400/65 bg-violet-50/90"

  /** 本课加工 / 证据两格：亮边 + 外光呼吸；动效仅 motion-safe，减弱动效时用静态 shadow */
  const focusGlow =
    !spotlight && tone === "tan"
      ? "ring-2 ring-amber-200/90 ring-offset-2 ring-offset-[#ebe4d8] motion-safe:animate-poster-glow-amber motion-reduce:shadow-[0_0_0_1px_rgba(253,230,138,0.5),0_4px_20px_-2px_rgba(251,191,36,0.42),0_12px_40px_-12px_rgba(245,158,11,0.28)]"
      : !spotlight && tone === "green"
        ? "ring-2 ring-emerald-200/90 ring-offset-2 ring-offset-[#ebe4d8] motion-safe:animate-poster-glow-emerald motion-reduce:shadow-[0_0_0_1px_rgba(167,243,208,0.55),0_4px_20px_-2px_rgba(52,211,153,0.38),0_12px_40px_-12px_rgba(16,185,129,0.22)]"
        : ""

  const spotlightRing = spotlight
    ? "relative z-30 ring-[3px] ring-amber-400 ring-offset-2 ring-offset-[#ebe4d8] shadow-[0_12px_40px_-8px_rgba(245,158,11,0.45)]"
    : ""

  return (
    <article
      className={`relative overflow-hidden rounded-xl border-2 px-3 py-2.5 sm:px-3.5 sm:py-3 ${borderBg} ${focusGlow} ${spotlightRing} ${locked ? "opacity-[0.97]" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span className="mt-0.5 shrink-0 text-stone-600" aria-hidden>
            <Icon className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" strokeWidth={2.25} />
          </span>
          <h4 className="text-sm font-bold leading-snug text-stone-800 sm:text-base">{title}</h4>
        </div>
        <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-medium text-stone-500 ring-1 ring-stone-200/80 sm:text-[10px]">
          {locked ? (
            <span className="inline-flex items-center gap-0.5">
              <Lock className="h-2.5 w-2.5 opacity-70" aria-hidden />
              {statusLabel}
            </span>
          ) : (
            statusLabel
          )}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-stone-700 sm:text-sm">{body}</p>
      <p className="mt-2 border-t border-dashed border-stone-300/70 pt-2 text-[10px] text-stone-500 sm:text-[11px]">
        {foot}
      </p>
      {dimmed ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-[10px] bg-black/50"
          aria-hidden
        />
      ) : null}
    </article>
  )
}
