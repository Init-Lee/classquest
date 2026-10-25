/**
 * 文件说明：模块 2 图片资产纯逻辑回归测试。
 * 职责：锁定 SHA-256 纯 JS 兜底的标准测试向量（并与 crypto.subtle 交叉核对）、按魔数识别 PNG/JPEG/WebP 与拒绝改后缀的非图片、解码前读取文件头尺寸、限额判断、主图 / 缩略图尺寸规划、串行队列与版本库存去重。
 * 更新触发：sha256.ts、image-sniff.ts、image-plan.ts、serial-queue.ts、image-versions.ts 或 RESOURCE_LIMITS / IMAGE_PRESETS 变化时，需要同步更新本文件；canvas 相关逻辑只能在浏览器手动验证。
 */

import { afterEach, describe, expect, it, vi } from "vitest"
import { sha256Hex, sha256HexFallback } from "./sha256"
import { checkImageLimits, readImageHeader, sniffImageMime } from "./image-sniff"
import { computeScaledSize, planMainImage, planThumbnail } from "./image-plan"
import { createLimitedRunner } from "./serial-queue"
import { addModule2ImageVersion } from "@/modules/module-2-ai-comic/domains/portfolio/image-versions"
import { createNewModule2Portfolio } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"

const text = (value: string) => new TextEncoder().encode(value)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("SHA-256", () => {
  // FIPS 180-2 / NIST 标准测试向量
  const vectors: Array<[string, Uint8Array, string]> = [
    ["空输入", new Uint8Array(0), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", text("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
    ["448 位", text("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"), "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"],
    ["896 位", text("abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"), "cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1"],
    ["一百万个 a", new Uint8Array(1_000_000).fill(0x61), "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0"],
  ]

  for (const [name, input, expected] of vectors) {
    it(`纯 JS 兜底：${name}`, () => {
      expect(sha256HexFallback(input)).toBe(expected)
    })
  }

  it("分块边界长度（55/56/63/64/65/119/120 字节）与 crypto.subtle 一致", async () => {
    for (const length of [1, 55, 56, 63, 64, 65, 119, 120, 1000]) {
      const data = Uint8Array.from({ length }, (_, index) => (index * 31 + 7) & 0xff)
      expect(sha256HexFallback(data)).toBe(await sha256Hex(data))
    }
  })

  it("crypto.subtle 不可用时自动使用兜底实现", async () => {
    vi.stubGlobal("crypto", undefined)
    expect(await sha256Hex(text("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  })
})

function pngHeader(width: number, height: number, colorType: number, extraChunk?: string): Uint8Array {
  const bytes: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const u32 = (value: number) => [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]
  const chunk = (type: string, data: number[]) => {
    bytes.push(...u32(data.length), ...Array.from(text(type)), ...data, 0, 0, 0, 0)
  }
  chunk("IHDR", [...u32(width), ...u32(height), 8, colorType, 0, 0, 0])
  if (extraChunk) chunk(extraChunk, [0, 0])
  chunk("IDAT", [0])
  return Uint8Array.from(bytes)
}

function jpegHeader(width: number, height: number): Uint8Array {
  return Uint8Array.from([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x10, ...Array.from(text("JFIF")), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0,
    0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
  ])
}

function webpVp8xHeader(width: number, height: number, alpha: boolean): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set(text("RIFF"), 0)
  bytes.set(text("WEBP"), 8)
  bytes.set(text("VP8X"), 12)
  bytes[16] = 10
  bytes[20] = alpha ? 0x10 : 0
  const w = width - 1
  const h = height - 1
  bytes.set([w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff], 24)
  bytes.set([h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff], 27)
  return bytes
}

describe("按魔数识别 MIME", () => {
  it("识别 PNG、JPEG、WebP，不看后缀", () => {
    expect(sniffImageMime(pngHeader(10, 10, 2))).toEqual({ ok: true, mime: "image/png" })
    expect(sniffImageMime(jpegHeader(10, 10))).toEqual({ ok: true, mime: "image/jpeg" })
    expect(sniffImageMime(webpVp8xHeader(10, 10, false))).toEqual({ ok: true, mime: "image/webp" })
  })

  it("改了后缀的文本文件、GIF、PDF、空文件明确提示不支持", () => {
    const fake = sniffImageMime(text("这其实是一份文本，只是改名成了 .png"))
    expect(fake.ok).toBe(false)
    if (!fake.ok) expect(fake.message).toContain("PNG、JPEG、WebP")
    const gif = sniffImageMime(text("GIF89a......"))
    expect(!gif.ok && gif.message).toContain("GIF")
    const pdf = sniffImageMime(text("%PDF-1.7"))
    expect(!pdf.ok && pdf.message).toContain("PDF")
    expect(sniffImageMime(new Uint8Array(0)).ok).toBe(false)
  })
})

describe("解码前读取文件头尺寸", () => {
  it("PNG：宽高与透明通道（颜色类型 6 / tRNS）", () => {
    expect(readImageHeader(pngHeader(1024, 768, 2), "image/png")).toEqual({ width: 1024, height: 768, mayHaveAlpha: false })
    expect(readImageHeader(pngHeader(64, 32, 6), "image/png")?.mayHaveAlpha).toBe(true)
    expect(readImageHeader(pngHeader(64, 32, 3, "tRNS"), "image/png")?.mayHaveAlpha).toBe(true)
  })

  it("JPEG：从 SOF 段读取宽高", () => {
    expect(readImageHeader(jpegHeader(4000, 3000), "image/jpeg")).toEqual({ width: 4000, height: 3000, mayHaveAlpha: false })
  })

  it("WebP VP8X：宽高与透明标记", () => {
    expect(readImageHeader(webpVp8xHeader(2000, 1000, true), "image/webp")).toEqual({ width: 2000, height: 1000, mayHaveAlpha: true })
  })

  it("截断文件读不出尺寸", () => {
    expect(readImageHeader(pngHeader(10, 10, 2).subarray(0, 20), "image/png")).toBeNull()
    expect(readImageHeader(Uint8Array.from([0xff, 0xd8, 0xff]), "image/jpeg")).toBeNull()
  })
})

describe("限额判断", () => {
  it("字节数、单边与总像素超限都拒绝，未超限返回 null", () => {
    expect(checkImageLimits(1024, 1536, 1024)).toBeNull()
    expect(checkImageLimits(RESOURCE_LIMITS.imageMaxBytes + 1, 10, 10)).toContain("太大")
    expect(checkImageLimits(1024, RESOURCE_LIMITS.imageMaxSide + 1, 10)).toContain("尺寸")
    // 单边不超限但总像素超限（巨像素小文件）
    expect(checkImageLimits(1024, 8000, 8000)).toContain("像素")
  })
})

describe("主图与缩略图规划", () => {
  it("长边 1536，小图不放大不裁切；缩小时按透明选择输出格式", () => {
    expect(computeScaledSize(1024, 1024, 1536)).toEqual({ width: 1024, height: 1024, scaled: false })
    expect(planMainImage(1024, 1024, false)).toEqual({ keepOriginal: true, width: 1024, height: 1024 })
    expect(planMainImage(3000, 2000, false)).toEqual({ keepOriginal: false, width: 1536, height: 1024, mime: "image/jpeg", quality: 0.88 })
    expect(planMainImage(2000, 4000, true)).toEqual({ keepOriginal: false, width: 768, height: 1536, mime: "image/png", quality: undefined })
  })

  it("缩略图长边 384，小图不放大", () => {
    expect(planThumbnail(3000, 2000, false)).toEqual({ width: 384, height: 256, mime: "image/jpeg", quality: 0.88 })
    expect(planThumbnail(100, 50, true)).toEqual({ width: 100, height: 50, mime: "image/png", quality: undefined })
  })
})

describe("图片处理串行队列", () => {
  it("并发 1 时按顺序逐个执行，单个失败不阻断后续", async () => {
    const run = createLimitedRunner(1)
    const order: string[] = []
    let active = 0
    let maxActive = 0
    const task = (name: string, fail = false) => run(async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      order.push(`start:${name}`)
      await new Promise(resolve => setTimeout(resolve, 5))
      order.push(`end:${name}`)
      active -= 1
      if (fail) throw new Error(name)
      return name
    })
    const results = await Promise.allSettled([task("a"), task("b", true), task("c")])
    expect(maxActive).toBe(1)
    expect(order).toEqual(["start:a", "end:a", "start:b", "end:b", "start:c", "end:c"])
    expect(results.map(item => item.status)).toEqual(["fulfilled", "rejected", "fulfilled"])
    expect(() => createLimitedRunner(0)).toThrow()
  })
})

describe("图片版本入库存", () => {
  it("原图与主图相同只登记一次，已在库存中的资产不重复登记", () => {
    const asset = `sha256:${"a".repeat(64)}`
    const base = createNewModule2Portfolio()
    const v1 = { id: "v1", slot: "other" as const, sourceSnapshotId: "s", mainAssetId: asset, originalAssetId: asset, prompt: "", referenceAssetIds: [asset], createdAt: base.createdAt, toolLabel: "", note: "" }
    const first = addModule2ImageVersion(base, v1)
    expect(first.portfolio.assetIds).toEqual([asset])
    const second = addModule2ImageVersion(first.portfolio, { ...v1, id: "v2" })
    expect(second.addedAssetIds).toEqual([])
    expect(second.portfolio.assetIds).toEqual([asset])
    expect(() => addModule2ImageVersion(second.portfolio, v1)).toThrow()
  })
})
