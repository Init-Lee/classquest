/**
 * 文件说明：模块 2 小说 HTML 的字符串文本提取。
 * 职责：只把已知片段里的换行、标签和 HTML 实体还原成普通文字；不构造 DOM，不执行脚本，不请求图片或外链。
 * 更新触发：小说 HTML 的换行规则、实体解码或需要忽略的标签种类变化时，需要同步更新本文件。
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: "\u00a0",
}

/** 单次解码。先去掉标签再解码，避免把转义后的标签重新变成可执行标记。 */
export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (full, entity: string) => {
    if (entity[0] === "#") {
      const hex = entity[1] === "x" || entity[1] === "X"
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10)
      if (!Number.isInteger(code) || code <= 0 || code > 0x10ffff) return full
      try {
        return String.fromCodePoint(code)
      } catch {
        return full
      }
    }
    return NAMED_ENTITIES[entity] ?? full
  })
}

/** 读取开始标签上的属性。属性值只当文字，不解析成地址。 */
export function readHtmlAttr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i"))
  if (!match) return null
  return match[1] ?? match[2] ?? match[3] ?? ""
}

/** 属性名存在即可，兼容 `<h1 data-cq-story-title>` 这种无值写法。 */
export function hasHtmlAttr(attrs: string, name: string): boolean {
  return new RegExp(`(?:^|\\s)${name}(?:\\s*=|\\s|\\/|>|$)`, "i").test(attrs)
}

/**
 * 把一小段 HTML 还原成纯文本。
 * `<br>` 以及它后面紧跟的一个换行算一个换行；script/style 整段丢弃，不留正文。
 */
export function htmlFragmentToPlain(fragment: string): string {
  const withoutBlocks = fragment
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
  const withBreaks = withoutBlocks.replace(/<br\s*\/?\s*>\r?\n?/gi, "\n")
  const noTags = withBreaks.replace(/<[^>]*>/g, "")
  return decodeHtmlEntities(noTags)
}
