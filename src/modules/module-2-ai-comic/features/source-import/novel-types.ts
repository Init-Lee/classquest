/**
 * 文件说明：模块 2 小说导入的解析结果类型。
 * 职责：描述「可保存的候选草稿」和「明确拒绝」两种结果，供解析器、确认事务和后续课时页面共用。
 * 更新触发：小说导入的成功/失败分类、候选草稿字段或给学生看的结果语义变化时，需要同步更新本文件。
 */

import type { SourceImportDraft } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export type NovelRejectCode =
  | "too-large"
  | "undecodable"
  | "stage-snapshot"
  | "module1-package"
  | "module2-package"
  | "metadata-invalid"
  | "version-unsupported"
  | "visible-mismatch"
  | "duplicate-data-block"
  | "unsupported"

/** 已提取或需要人工填写的候选。确认前不得覆盖已有原作。 */
export interface NovelCandidate {
  kind: "candidate"
  review: "extracted" | "manual"
  message: string
  draft: SourceImportDraft
}

/** 拒绝读入。调用方必须保持原档案不变。 */
export interface NovelRejected {
  kind: "rejected"
  code: NovelRejectCode
  message: string
}

export type NovelParseResult = NovelCandidate | NovelRejected

export interface NovelFileMeta {
  filename: string | null
  importedAt: string
  sourceFileSha256: string | null
}
