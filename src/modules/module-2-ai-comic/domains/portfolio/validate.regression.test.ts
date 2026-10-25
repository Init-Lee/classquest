/**
 * 文件说明：模块 2 档案运行时校验器回归测试。
 * 职责：锁定合法空草稿与空字段候选可通过、已确认来源须完整、坏引用 / 重复 ID / 类型错误被拒、未知未来版本被拒并说明原因、危险键被安全忽略且不污染原型。
 * 更新触发：validate.ts 的字段、长度、引用或版本规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { validateModule2Portfolio } from "./validate"
import { createNewModule2Portfolio, type ImageVersion, type Module2PortfolioV1 } from "./types"

const NOW = "2026-10-25T10:00:00.000Z"
const ASSET_A = `sha256:${"a".repeat(64)}`
const ASSET_B = `sha256:${"b".repeat(64)}`

function withSource(): Module2PortfolioV1 {
  return {
    ...createNewModule2Portfolio(undefined, NOW),
    sourceSnapshot: {
      id: "src-1",
      origin: "classquest-html-v1",
      filename: "小说.html",
      sourceFileSha256: "c".repeat(64),
      importedAt: NOW,
      studentConfirmedAt: NOW,
      sourceConfirmedAt: null,
      student: { clazz: "", studentName: "", classSeatCode: "" },
      storyTitle: "题目",
      parts: { opening: "起", development: "承", turn: "转", ending: "合" },
      isTeachingSample: false,
      importNote: "",
    },
  }
}

function version(id: string, overrides: Partial<ImageVersion> = {}): ImageVersion {
  return {
    id,
    slot: "opening",
    sourceSnapshotId: "src-1",
    mainAssetId: ASSET_A,
    originalAssetId: ASSET_A,
    prompt: "",
    referenceAssetIds: [],
    createdAt: NOW,
    toolLabel: "",
    note: "",
    ...overrides,
  }
}

function withImages(): Module2PortfolioV1 {
  return {
    ...withSource(),
    assetIds: [ASSET_A, ASSET_B],
    imageVersions: [version("v1"), version("v2", { mainAssetId: ASSET_B })],
    selectedVersions: { opening: "v2" },
    iterations: [{
      id: "it-1", problem: "", evidence: "", changedConditions: "", judgment: "",
      beforeVersionId: "v1", afterVersionId: "v2", selectedVersionId: "v2", createdAt: NOW,
    }],
  }
}

function roundTrip(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value))
}

describe("validateModule2Portfolio：合法输入", () => {
  it("身份全空的首次草稿合法", () => {
    const result = validateModule2Portfolio(roundTrip(createNewModule2Portfolio(undefined, NOW)))
    expect(result.ok).toBe(true)
  })

  it("空字段候选草稿合法（结构合法与课堂完成分开）", () => {
    const p = createNewModule2Portfolio(undefined, NOW)
    p.sourceImportDraft = {
      origin: "manual", filename: null, sourceFileSha256: null, importedAt: NOW, sourceConfirmedAt: null,
      student: { clazz: "", studentName: "", classSeatCode: "" }, storyTitle: "",
      parts: { opening: "", development: "", turn: "", ending: "" }, isTeachingSample: false, importNote: "",
    }
    expect(validateModule2Portfolio(roundTrip(p)).ok).toBe(true)
  })

  it("带图片版本、选中版本与修改记录的完整引用合法，并输出新对象", () => {
    const input = roundTrip(withImages())
    const result = validateModule2Portfolio(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).not.toBe(input)
      expect(result.value.imageVersions).toHaveLength(2)
    }
  })
})

describe("validateModule2Portfolio：拒绝", () => {
  it("已确认来源的题目或四段为空时拒绝", () => {
    const p = withSource()
    p.sourceSnapshot!.parts.turn = "  "
    const result = validateModule2Portfolio(roundTrip(p))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join("\n")).toContain("sourceSnapshot.parts.turn")
  })

  it("版本引用的资产不在库存中时拒绝", () => {
    const p = withImages()
    p.assetIds = [ASSET_A]
    const result = validateModule2Portfolio(roundTrip(p))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join("\n")).toContain("不在 assetIds 中")
  })

  it("选中版本或修改记录引用不存在的版本时拒绝", () => {
    const selected = withImages()
    selected.selectedVersions = { ending: "v-missing" }
    expect(validateModule2Portfolio(roundTrip(selected)).ok).toBe(false)
    const iteration = withImages()
    iteration.iterations[0].afterVersionId = "v-missing"
    expect(validateModule2Portfolio(roundTrip(iteration)).ok).toBe(false)
    const notChoice = withImages()
    notChoice.iterations[0].selectedVersionId = "v1"
    notChoice.iterations[0].beforeVersionId = "v2"
    notChoice.iterations[0].afterVersionId = "v2"
    expect(validateModule2Portfolio(roundTrip(notChoice)).ok).toBe(false)
  })

  it("版本或选景引用不存在的来源时拒绝", () => {
    const p = withImages()
    p.imageVersions[0].sourceSnapshotId = "src-missing"
    expect(validateModule2Portfolio(roundTrip(p)).ok).toBe(false)
    const sb = withSource()
    sb.storyboard.sourceSnapshotId = "src-missing"
    expect(validateModule2Portfolio(roundTrip(sb)).ok).toBe(false)
  })

  it("重复 ID 拒绝", () => {
    const assets = withImages()
    assets.assetIds = [ASSET_A, ASSET_B, ASSET_A]
    expect(validateModule2Portfolio(roundTrip(assets)).ok).toBe(false)
    const versions = withImages()
    versions.imageVersions[1].id = "v1"
    expect(validateModule2Portfolio(roundTrip(versions)).ok).toBe(false)
  })

  it("类型、枚举、长度与资产 ID 格式错误拒绝", () => {
    const bad = (mutate: (p: Record<string, unknown>) => void) => {
      const p = roundTrip(withImages()) as Record<string, unknown>
      mutate(p)
      return validateModule2Portfolio(p).ok
    }
    expect(bad(p => { p.revision = -1 })).toBe(false)
    expect(bad(p => { p.moduleId = "module-1-ai-story" })).toBe(false)
    expect(bad(p => { (p.student as Record<string, unknown>).studentName = 123 })).toBe(false)
    expect(bad(p => { (p.student as Record<string, unknown>).studentName = "名".repeat(65) })).toBe(false)
    expect(bad(p => { (p.imageVersions as Record<string, unknown>[])[0].slot = "cover" })).toBe(false)
    expect(bad(p => { p.assetIds = ["sha256:XYZ", ASSET_B] })).toBe(false)
    expect(bad(p => { p.createdAt = "昨天" })).toBe(false)
    expect(bad(p => { p.selectedVersions = { cover: "v1" } })).toBe(false)
    expect(bad(p => { delete p.sourceImportDraft })).toBe(false)
    expect(validateModule2Portfolio(null).ok).toBe(false)
    expect(validateModule2Portfolio([]).ok).toBe(false)
  })

  it("未知未来 schemaVersion 拒绝并说明原因；缺失或非 1 版本也拒绝", () => {
    const future = { ...(roundTrip(createNewModule2Portfolio()) as object), schemaVersion: 2, futureField: { x: 1 } }
    const result = validateModule2Portfolio(future)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe("future-version")
      expect(result.message).toContain("更新版本")
      expect(result.message).toContain("2")
    }
    const zero = validateModule2Portfolio({ ...(roundTrip(createNewModule2Portfolio()) as object), schemaVersion: 0 })
    expect(!zero.ok && zero.reason).toBe("invalid")
  })
})

describe("validateModule2Portfolio：危险键", () => {
  it("__proto__、constructor 等键被安全忽略，不污染原型、不出现在输出中", () => {
    const base = JSON.stringify(withImages())
    const hostile = JSON.parse(base.replace(
      "{",
      '{"__proto__":{"polluted":true,"id":"hijack"},"constructor":{"prototype":{"polluted":true}},',
    ).replace(
      '"selectedVersions":{',
      '"selectedVersions":{"__proto__":{"polluted":true},"constructor":"v1",',
    ))
    const result = validateModule2Portfolio(hostile)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Object.prototype.hasOwnProperty.call(result.value, "__proto__")).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(result.value, "constructor")).toBe(false)
    expect(Object.keys(result.value.selectedVersions)).toEqual(["opening"])
    expect(result.value.id).not.toBe("hijack")
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it("只读自有属性：原型链上的字段不能冒充档案字段", () => {
    const inherited = Object.create(roundTrip(createNewModule2Portfolio()) as object)
    expect(validateModule2Portfolio(inherited).ok).toBe(false)
  })
})
