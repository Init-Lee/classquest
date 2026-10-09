/**
 * 文件说明：模块 1 只读小说正文。
 * 职责：供课时 6 校对预览和「我的小说」共用，按纯文本排版题目与四段，并固定显示课时来源标签，不另存全文。
 * 更新触发：预览与作品页的段落顺序、来源标签或文本渲染方式变化时，需要同步更新本文件。
 */

export interface Module1StoryReadingPart {
  id: string
  label: string
  text: string
}

interface Module1StoryReadingProps {
  title: string
  untitledLabel: string
  parts: Module1StoryReadingPart[]
}

export function Module1StoryReading({
  title,
  untitledLabel,
  parts,
}: Module1StoryReadingProps) {
  const heading = title.trim() || untitledLabel
  return (
    <article className="mx-auto max-w-2xl space-y-6 text-base leading-8">
      <h2 className="text-center text-2xl font-semibold leading-snug">{heading}</h2>
      {parts.map(part => (
        part.text.trim() ? (
          <section key={part.id} className="border-l-2 border-primary/30 pl-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">{part.label}</p>
            <p className="whitespace-pre-wrap">{part.text}</p>
          </section>
        ) : null
      ))}
    </article>
  )
}
