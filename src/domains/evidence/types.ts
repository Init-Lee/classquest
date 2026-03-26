/**
 * 文件说明：证据记录领域类型定义
 * 职责：定义课时2中公开资源入库与现场采集任务的标准化数据结构，
 *       包含质检结果与任务分配条目
 * 更新触发：课时2记录字段变化时；新增证据类型时；质检规则调整时
 */

/** 证据来源类型 */
export type EvidenceSourceType = "public" | "field"

/** 课时2任务分配条目（来自组长文件的分工） */
export interface Lesson2Assignment {
  /** 对应课时1证据清单行的索引 */
  planIndex: number
  /** 证据项名称 */
  item: string
  /** 负责人姓名列表（支持多人协作） */
  owners: string[]
  /** 预计来源类型 */
  expectedSourceType: EvidenceSourceType | "mixed"
  /** 来源的组长文件版本号 */
  fromLeaderVersion: number
}

/**
 * 公开资源证据记录（课堂必做）
 * 对齐支架文件 v1 的字段体系，素材类型/方法均以数组存储
 */
export interface PublicEvidenceRecord {
  planIndex: number
  item: string
  owner: string
  sourceType: "public"

  /** 资源类型（下拉：统计数据/政策文件/机构报告/新闻报道/科普文章/学术论文/其他） */
  resourceType: string
  /** resourceType 为"其他"时的补充说明 */
  resourceTypeOther?: string

  /** 来源平台（下拉：政府/机构官网/学校官网/数据库平台/媒体网站/百科类网站/其他） */
  sourcePlatform: string
  /** sourcePlatform 为"其他"时的补充说明 */
  sourcePlatformOther?: string

  /** 发布机构（自由文本，保留） */
  sourceOrg: string

  /** 链接 URL 列表（至少填 1 条，第一条用于自动引用） */
  urls: string[]

  /** 发布/更新时间（yyyy-mm-dd；publishedUnknown 为 true 时留空） */
  publishedAt: string
  /** 发布时间是否不确定 */
  publishedUnknown: boolean

  /** 获取时间（yyyy-mm-dd，必填） */
  capturedAt: string

  /** 素材类型（多选：文字/数据/图像/视频/音频/其他） */
  materialTypes: string[]

  /** 方法与工具（多选复选框：检索/站内搜索/下载PDF/截图/数据整理/其他） */
  methods: string[]
  /** methods 含"其他"时的补充说明 */
  methodOther?: string

  /** 摘要/引用笔记（保留，用于质检） */
  quoteOrNote: string

  /** 自动生成的采集记录条目 */
  citationFull: string

  /** 记录状态 */
  status: "draft" | "checked"
}

/**
 * 现场采集任务（课后完成）
 * 对齐支架文件 v1，包含场景、合规确认、自动引用等字段
 */
export interface FieldEvidenceTask {
  planIndex: number
  item: string
  owner: string
  sourceType: "field"

  /** 素材名称（必填，简短命名，如"操场东门噪声读数"） */
  materialName: string

  /** 采集场景（下拉：校园/社区/家庭/街区/公园/商场/路口/其他） */
  scene: string
  /** scene 为"其他"时的补充说明 */
  sceneOther?: string

  /** 地点描述（可选，更具体的位置说明） */
  location?: string

  /** 采集日期（yyyy-mm-dd） */
  date: string

  /** 实际素材类型（多选：文字/数据/图像/视频/音频/其他） */
  materialTypes: string[]

  /** 实际方法与工具（多选复选框：拍照/摄像/计数/访谈录音/测量/其他） */
  methods: string[]
  /** methods 含"其他"时的补充说明 */
  methodOther?: string

  /** 合规确认：未拍摄他人人脸（或已获同意） */
  compNoFace: boolean
  /** 合规确认：未拍隐私场所 */
  compNoPrivate: boolean
  /** 合规确认：数据真实不造假 */
  compNoFake: boolean
  /** 合规确认：结伴安全采集 */
  compSafety: boolean

  /** 自动生成的采集记录条目 */
  citationFull: string

  /** 任务状态 */
  status: "todo" | "in-progress" | "done"
}

/** 质检结果条目 */
export interface QualityCheckResult {
  /** 对应的公开资源记录索引 */
  recordIndex: number
  /** 有来源平台与获取时间 */
  hasSourceAndTime: boolean
  /** 摘要说明了与研究问题的关系 */
  provesSomething: boolean
  /** 至少一条 URL 不为空 */
  isLocatable: boolean
  /** 质检是否通过 */
  passed: boolean
  /** 检查时间 */
  checkedAt: string
}
