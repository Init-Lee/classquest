/**
 * 文件说明：模块 2 统一资源限额配置（RESOURCE_LIMITS）。
 * 职责：集中声明小说导入、档案校验、图片资产服务与学习包导入导出共用的容量与并发上限，以及图片压缩起点参数；全模块只允许从这里读取限额。
 * 更新触发：机房浏览器实测、所选 ZIP 库能力、图片压缩参数或学习包容量规则变化时，需要同步更新本文件与模块 README 的“RESOURCE_LIMITS 初值”表。
 *
 * 这些数值是实现环境的能力限制，不是课程规则；当前均为初值，待机房验证后再冻结。
 */

const KIB = 1024
const MIB = 1024 * KIB

export const RESOURCE_LIMITS = {
  /** 小说文件（HTML / MD）读取上限，以及单段正文的最大字符数。 */
  novelFileMaxBytes: 2 * MIB,
  novelPartMaxChars: 20_000,
  /** 学习包内 manifest.json 与 portfolio.json 的最大字节数。 */
  manifestMaxBytes: 1 * MIB,
  portfolioMaxBytes: 8 * MIB,
  /** 学习包输入文件（压缩后）上限。 */
  packageInputMaxBytes: 300 * MIB,
  /** 解压时累计的实际输出总量上限（不信目录声明）。 */
  packageExtractedMaxBytes: 400 * MIB,
  /** 学习包内条目数上限（manifest + portfolio + 资产）。 */
  packageMaxEntries: 400,
  /** 单张图片（原图）字节上限。 */
  imageMaxBytes: 25 * MIB,
  /** 单张图片宽 / 高上限与总像素上限（宽×高×4 只是单份 RGBA 的最低内存估算）。 */
  imageMaxSide: 8192,
  imageMaxPixels: 40_000_000,
  /** 同时处理（解码 / 压缩 / 哈希）的图片数量。 */
  imageProcessingConcurrency: 1,
  /** 学习包体积提醒线：超过时提示“可能需要更多时间”，不是失败线。 */
  packageWarnBytes: 50 * MIB,
} as const

/** 图片压缩起点参数（data-contract / learning-package 第 1 节），机房对比后才能冻结。 */
export const IMAGE_PRESETS = {
  mainLongEdge: 1536,
  thumbnailLongEdge: 384,
  jpegQuality: 0.88,
  /** 缩略图预设版本：参数变化时递增，旧缓存自然失效并按需重建。 */
  thumbnailPresetVersion: 1,
} as const
