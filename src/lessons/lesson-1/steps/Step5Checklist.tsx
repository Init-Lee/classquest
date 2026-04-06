/**
 * 文件说明：课时1 · 步骤4 · 证据收集清单（Wizard 分步填写）
 * 职责：引导学生分步完成：组员登记 → 执行表 → 分工确认 → 安全承诺
 *       子步骤0（组员登记）：
 *         - 组长输入其他组员人数 N，组长自身自动加入
 *         - 生成 N 个姓名输入框；减少人数时删除末尾锁定行并清理新增行 owners
 *       子步骤1（执行表）：
 *         - 系统锁定行（N+1 行）：每人一行，负责人预填且不可修改
 *         - 用户新增行：负责人可多选
 *         - 过关：所有锁定行证据项不为空 AND 总数 >= 3
 *       子步骤2-3（分工确认/安全承诺）：分工只读展示，安全承诺组员可勾选
 *       Bug1修复：子步骤标签点击时验证前置条件，防止跳步
 *       Bug2修复：step5 完成状态由 guards 的 step4Done 条件驱动
 *       执行表子步与分工确认子步使用主内容全宽（max-w-7xl）；宽屏下单行证据卡多列排布；
 *       负责人置于每行卡片左上角单行展示，锁定说明在卡片底部；分工确认大屏双列铺满
 * 更新触发：清单字段变化时；子步骤逻辑调整时；角色权限逻辑调整时；布局断点调整时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ArrowLeft, Plus, Trash2, Sparkles, CheckCircle2, Circle, Lock } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"
import type { GroupEvidencePlanRow } from "@/domains/group-plan/types"
import { AIHelperDrawer } from "../components/AIHelperDrawer"

const SUB_STEPS = ["组员登记", "执行表", "分工确认", "安全承诺"]

/** 新建一条空的用户自定义行（可多选负责人） */
function emptyFreeRow(): GroupEvidencePlanRow {
  return { item: "", type: "first-hand", whereWhen: "", method: "", recordIdea: "", owners: [], locked: false }
}

/** 新建一条锁定行（负责人预填，不可修改） */
function lockedRow(owner: string): GroupEvidencePlanRow {
  return { item: "", type: "first-hand", whereWhen: "", method: "", recordIdea: "", owners: [owner], locked: true }
}

/** 证据类型中文展示（分工确认等只读场景） */
function evidenceTypeLabel(type: GroupEvidencePlanRow["type"]): string {
  return type === "second-hand" ? "公开资源" : "现场采集"
}

export default function Step5Checklist() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [subStep, setSubStep] = useState(0)
  const [aiOpen, setAiOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const isLeader = portfolio?.student.role === "leader"
  const leaderName = portfolio?.student.studentName ?? ""
  // 当前用户在小组中的名字：组长=注册姓名，组员=组长文件中确认的名字（confirmedOwnerName）
  // 必须用此值做"（你）"标记，避免注册名与组长录入名不一致时出现幽灵行
  const myGroupName = isLeader
    ? leaderName
    : (portfolio?.lesson1.confirmedOwnerName ?? leaderName)

  // ── 子步骤0：组员登记 ──
  // otherMembers: 仅组长维护，除组长自身外的其他成员姓名列表（长度 = N）
  // 组员不修改此列表，始终返回空数组（组员的 allMembers 直接来自 groupMembers）
  const initOtherMembers = (): string[] => {
    if (!isLeader) return []
    const saved = portfolio?.lesson1.groupMembers ?? []
    return saved.filter(m => m !== leaderName)
  }
  const [otherMembers, setOtherMembers] = useState<string[]>(initOtherMembers)

  // N = 其他组员人数
  const memberCount = otherMembers.length
  // 完整成员列表：
  //   组长：自身排第一 + otherMembers
  //   组员：直接使用组长文件中的 groupMembers，不再用注册名自行拼接（防止产生幽灵行）
  const allMembers = isLeader
    ? (leaderName ? [leaderName, ...otherMembers] : otherMembers)
    : (portfolio?.lesson1.groupMembers ?? [])

  /**
   * 调整其他组员人数：
   * 增加 → 追加空白输入框
   * 减少 → 删末尾成员 & 其锁定行 & 清理其在新增行中的 owners
   */
  const handleMemberCountChange = (newCount: number) => {
    if (newCount < 0 || newCount > 15) return
    if (newCount > memberCount) {
      setOtherMembers(m => [...m, ...Array(newCount - memberCount).fill("")])
    } else if (newCount < memberCount) {
      const removed = otherMembers.slice(newCount) // 被移除的成员名字
      setOtherMembers(m => m.slice(0, newCount))
      // 级联更新执行表：删锁定行、清理新增行 owners
      setEvidences(evs => evs
        .filter(ev => {
          // 严格等号：只删除明确标记为锁定的行
          if (ev.locked === true) return !removed.includes(ev.owners[0] ?? "")
          return true
        })
        .map(ev => {
          if (ev.locked === false) {
            // 新增行：从 owners 中移除被删成员
            return { ...ev, owners: ev.owners.filter(o => !removed.includes(o)) }
          }
          return ev
        })
      )
    }
  }

  // ── 子步骤1：执行表 ──
  const [evidences, setEvidences] = useState<GroupEvidencePlanRow[]>(() => {
    const rows = portfolio?.lesson1.evidenceRows ?? []
    return rows.length ? rows : []
  })

  const [declaration, setDeclaration] = useState(portfolio?.lesson1.declarationAgreed || false)

  // ── 完成条件计算 ──
  const validMembers = allMembers.filter(m => m.trim())
  // 组长：所有 N 个输入框必须填写完整；组员：groupMembers 由组长维护无需再校验
  const allOtherMembersFilled = isLeader ? otherMembers.every(m => m.trim()) : true
  const membersOk = validMembers.length > 0 && allOtherMembersFilled

  // 严格等号分类：locked===true 为锁定行，locked===false 为用户新增行；
  // locked===undefined（老数据）不归入任何分组，防止被当成自由行自动展示
  const lockedRows = evidences.filter(ev => ev.locked === true)
  const freeRows = evidences.filter(ev => ev.locked === false)
  const lockedRowsComplete = lockedRows.every(ev => ev.item.trim())
  const evidenceCount = evidences.filter(ev => ev.item.trim()).length
  const evidenceOk = lockedRowsComplete && evidenceCount >= 3
  const canFinish = membersOk && evidenceOk && declaration

  /** 只读输入框样式 */
  const readonlyCls = "bg-muted/30 cursor-default focus-visible:ring-0"

  /**
   * Bug1：判断能否点击某个子步骤标签
   * 向后退始终允许；向前跳需满足前置条件
   */
  const canClickTab = (idx: number): boolean => {
    if (idx <= subStep) return true
    if (idx >= 1 && !membersOk) return false
    if (idx >= 2 && isLeader && !evidenceOk) return false
    return true
  }

  /**
   * 从 sub-step 0 进入 sub-step 1：
   * 同步锁定行：为当前 validMembers 补齐或新建锁定行，
   * 已有内容的锁定行保留，新增成员创建空锁定行
   */
  const handleNextFromMemberReg = () => {
    if (!membersOk) return
    // 严格等号：只保留明确标记 locked===true 的行，过滤老数据（locked===undefined）
    const existingLocked = evidences.filter(ev => ev.locked === true)
    const syncedLocked = validMembers.map(member => {
      const existing = existingLocked.find(r => r.owners[0] === member)
      return existing ?? lockedRow(member)
    })
    setEvidences([...syncedLocked, ...freeRows])
    setSubStep(1)
  }

  const handleAutoSave = async () => {
    if (!portfolio) return
    await savePortfolio({
      ...portfolio,
      lesson1: {
        ...portfolio.lesson1,
        groupMembers: validMembers,
        evidenceRows: evidences,
        declarationAgreed: declaration,
      },
    })
  }

  const handleSaveAndNext = async () => {
    if (!portfolio || !canFinish) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson1: {
          ...portfolio.lesson1,
          groupMembers: validMembers,
          evidenceRows: evidences,
          declarationAgreed: declaration,
        },
        pointer: advancePointer(portfolio.pointer, 1, 5),
      })
      navigate("/lesson/1/step/5")
    } finally {
      setSaving(false)
    }
  }

  const contextSummary = `证据清单：${evidences.filter(e => e.item).map(e => e.item).join("、")}`

  const wideMain = subStep === 1 || subStep === 2 || aiOpen

  return (
    <div className={`flex gap-6 w-full transition-all duration-200 ${wideMain ? "max-w-7xl" : "max-w-2xl"}`}>
      {/* 左侧主内容 */}
      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">第4关：证据收集清单</h3>
            <p className="text-muted-foreground text-sm">先登记组员，再一起规划证据采集</p>
          </div>
          <Button
            variant={aiOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setAiOpen(v => !v)}
            className="gap-1.5 flex-shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-yellow-500" /> AI 助手
          </Button>
        </div>

        {/* 子步骤进度条 */}
        <div className="flex items-center gap-2">
          {SUB_STEPS.map((label, idx) => {
            const clickable = canClickTab(idx)
            return (
              <div key={idx} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!clickable) return
                    if (idx === 1 && subStep === 0) handleNextFromMemberReg()
                    else setSubStep(idx)
                  }}
                  title={!clickable ? "请先完成当前步骤" : undefined}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    idx === subStep
                      ? "bg-primary text-primary-foreground"
                      : idx < subStep
                        ? "bg-green-100 text-green-700 cursor-pointer"
                        : clickable
                          ? "bg-muted text-muted-foreground cursor-pointer"
                          : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                  }`}
                >
                  {idx < subStep ? "✓ " : ""}{label}
                </button>
                {idx < SUB_STEPS.length - 1 && <div className="h-px w-4 bg-border" />}
              </div>
            )
          })}
        </div>

        {/* 组员提示横幅（子步骤1-2 只读） */}
        {!isLeader && subStep > 0 && subStep < 3 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
            <Lock className="h-3.5 w-3.5 flex-shrink-0" />
            以下内容由组长录入，你可以查看但不能修改。到第4步"安全承诺"勾选即可完成本关。
          </div>
        )}

        {/* ── 子步骤0：组员登记 ── */}
        {subStep === 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">组员姓名登记</CardTitle>
              <CardDescription>
                {isLeader
                  ? "先输入其他组员人数，再逐一填写姓名；你的名字已自动加入"
                  : "组长已录入的小组成员名单（只读）"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLeader ? (
                <>
                  {/* 组长信息（自动加入，只读） */}
                  <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border rounded-md">
                    <span className="text-xs text-muted-foreground w-20 flex-shrink-0">组长（你）</span>
                    <span className="text-sm font-medium">{leaderName}</span>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                  </div>

                  {/* 其他组员人数输入 */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      其他组员人数（不含你）
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button" variant="outline" size="icon"
                        className="h-9 w-9 flex-shrink-0"
                        onClick={() => handleMemberCountChange(memberCount - 1)}
                        disabled={memberCount === 0}
                      >
                        −
                      </Button>
                      <span className="text-lg font-semibold w-8 text-center">{memberCount}</span>
                      <Button
                        type="button" variant="outline" size="icon"
                        className="h-9 w-9 flex-shrink-0"
                        onClick={() => handleMemberCountChange(memberCount + 1)}
                        disabled={memberCount >= 15}
                      >
                        +
                      </Button>
                      <span className="text-xs text-muted-foreground">人（最多 15 人）</span>
                    </div>
                  </div>

                  {/* N 个姓名输入框 */}
                  {memberCount > 0 && (
                    <div className="space-y-2">
                      {otherMembers.map((name, idx) => {
                        const trimmed = name.trim()
                        const isDupWithLeader = trimmed && trimmed === leaderName
                        const isDupWithOther = trimmed && otherMembers.some((v, i) => i !== idx && v.trim() === trimmed)
                        const isDup = isDupWithLeader || isDupWithOther
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-14 flex-shrink-0">组员 {idx + 1}</span>
                              <Input
                                placeholder="请输入姓名"
                                value={name}
                                onChange={e => setOtherMembers(m => m.map((v, i) => i === idx ? e.target.value : v))}
                                className={isDup ? "border-amber-400" : ""}
                              />
                            </div>
                            {isDup && (
                              <p className="text-xs text-amber-600 pl-[3.75rem]">
                                ⚠ 与{isDupWithLeader ? "你（组长）" : "其他组员"}同名，建议加数字区分（如：{trimmed}2）
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {memberCount === 0 && (
                    <p className="text-xs text-muted-foreground">
                      当前仅你一人，执行表将只有你的锁定行，可手动添加更多任务行
                    </p>
                  )}
                </>
              ) : (
                /* Bug2修复：组员只读展示 —— 直接用 groupMembers（组长写入顺序），
                   避免以 leaderName=member.studentName 过滤后错把组员排在第一位显示为"组长" */
                (() => {
                  const gm = portfolio?.lesson1.groupMembers ?? []
                  // 检测小组内是否有同名成员
                  const gmCounts = gm.reduce<Record<string, number>>((acc, m) => {
                    acc[m] = (acc[m] ?? 0) + 1; return acc
                  }, {})
                  return (
                    <div className="space-y-2">
                      {gm.map((name, idx) => {
                        const isLeaderRow = idx === 0
                        const hasDup = (gmCounts[name] ?? 0) > 1
                        // 用 myGroupName（confirmedOwnerName）比对，防止注册名与组长录入名不一致
                        const isMe = name === myGroupName
                        return (
                          <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-muted/20 border rounded-md">
                            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
                              {isLeaderRow ? "组长" : `组员 ${idx}`}
                            </span>
                            <span className="text-sm">
                              {name}
                              {/* 有同名时在组长行名字后追加区分标记 */}
                              {isLeaderRow && hasDup && (
                                <span className="text-xs text-muted-foreground ml-1">（组长）</span>
                              )}
                            </span>
                            {isMe && <Badge className="ml-auto text-xs">你</Badge>}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()
              )}
            </CardContent>
          </Card>
        )}

        {/* ── 子步骤1：执行表 ── */}
        {subStep === 1 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">证据执行表</CardTitle>
                {isLeader && (
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setEvidences(e => [...e, emptyFreeRow()])}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> 添加一行
                  </Button>
                )}
              </div>
              <CardDescription>
                {isLeader
                  ? "每位成员均有一条锁定任务行（负责人不可改）；可继续添加多人协作任务"
                  : "小组确定的证据采集计划（来自组长，只读）"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 系统锁定行 */}
              {lockedRows.map((ev, rawIdx) => {
                const idx = evidences.indexOf(ev)
                return (
                  <EvidenceRowCard
                    key={`locked-${rawIdx}`}
                    ev={ev}
                    idx={idx}
                    isLeader={isLeader}
                    isLocked={true}
                    validMembers={validMembers}
                    myName={myGroupName}
                    readonlyCls={readonlyCls}
                    onChange={(patch) => setEvidences(d => d.map((r, i) => i === idx ? { ...r, ...patch } : r))}
                    onRemove={undefined}
                  />
                )
              })}

              {/* 分隔线（有新增行时才显示） */}
              {isLeader && freeRows.length > 0 && lockedRows.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span>以下为手动新增任务（可多选负责人）</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {/* 用户新增行 */}
              {freeRows.map((ev, rawIdx) => {
                const idx = evidences.indexOf(ev)
                return (
                  <EvidenceRowCard
                    key={`free-${rawIdx}`}
                    ev={ev}
                    idx={idx}
                    isLeader={isLeader}
                    isLocked={false}
                    validMembers={validMembers}
                    myName={myGroupName}
                    readonlyCls={readonlyCls}
                    onChange={(patch) => setEvidences(d => d.map((r, i) => i === idx ? { ...r, ...patch } : r))}
                    onRemove={isLeader ? () => setEvidences(d => d.filter((_, i) => i !== idx)) : undefined}
                  />
                )
              })}

              {/* 计数提示 */}
              {isLeader && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {!lockedRowsComplete && (
                    <p className="text-amber-600">
                      ⚠ 还有 {lockedRows.filter(r => !r.item.trim()).length} 条锁定行未填写证据项
                    </p>
                  )}
                  <p>
                    已填 {evidenceCount} 条
                    {!evidenceOk ? `，还需 ${Math.max(0, 3 - evidenceCount)} 条才能过关` : " ✓"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── 子步骤2：分工确认 ── */}
        {subStep === 2 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">分工确认</CardTitle>
              <CardDescription>按执行表展示每人负责的任务及地点、方法、记录思路等明细</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-3 w-full">
              {evidences.filter(e => e.item.trim()).length === 0 ? (
                <p className="text-sm text-muted-foreground">请先在"执行表"中填写证据计划</p>
              ) : (
                <div className="w-full space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                    {validMembers.filter(m => evidences.some(e => e.owners.includes(m))).map(member => (
                      <div key={member} className="rounded-lg border bg-muted/10 p-3 space-y-2 min-w-0">
                        <Badge variant={member === myGroupName ? "default" : "outline"} className="text-xs">
                          {member}{member === myGroupName ? "（你）" : ""}
                        </Badge>
                        <div className="space-y-2">
                          {evidences.filter(e => e.owners.includes(member) && e.item.trim()).map((ev, i) => (
                            <div
                              key={`${member}-${i}-${ev.item.slice(0, 24)}`}
                              className="rounded-md border bg-background p-2.5 text-xs space-y-1.5 leading-relaxed"
                            >
                              <p>
                                <span className="font-medium text-muted-foreground">证据项</span>{" "}
                                <span className="text-foreground">{ev.item}</span>
                              </p>
                              <p>
                                <span className="font-medium text-muted-foreground">类型</span>{" "}
                                {evidenceTypeLabel(ev.type)}
                              </p>
                              <p>
                                <span className="font-medium text-muted-foreground">地点与时间</span>{" "}
                                {ev.whereWhen?.trim() || "—"}
                              </p>
                              <p>
                                <span className="font-medium text-muted-foreground">方法与工具</span>{" "}
                                {ev.method?.trim() || "—"}
                              </p>
                              <p>
                                <span className="font-medium text-muted-foreground">记录思路</span>{" "}
                                {ev.recordIdea?.trim() || "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {evidences.filter(e => e.item.trim() && e.owners.length === 0).length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 w-full">
                      <p className="text-sm font-medium text-amber-900">⚠ 未分配负责人的任务</p>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {evidences.filter(e => e.item.trim() && e.owners.length === 0).map((ev, i) => (
                          <div key={`unassigned-${i}`} className="rounded-md border border-amber-100 bg-white/80 p-2.5 text-xs space-y-1.5 min-w-0">
                            <p><span className="font-medium text-muted-foreground">证据项</span> {ev.item}</p>
                            <p><span className="font-medium text-muted-foreground">类型</span> {evidenceTypeLabel(ev.type)}</p>
                            <p><span className="font-medium text-muted-foreground">地点与时间</span> {ev.whereWhen?.trim() || "—"}</p>
                            <p><span className="font-medium text-muted-foreground">方法与工具</span> {ev.method?.trim() || "—"}</p>
                            <p><span className="font-medium text-muted-foreground">记录思路</span> {ev.recordIdea?.trim() || "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── 子步骤3：安全承诺 ── */}
        {subStep === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">安全与承诺</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration}
                    onChange={e => setDeclaration(e.target.checked)}
                    className="h-4 w-4 mt-0.5 accent-primary"
                  />
                  <span className="text-sm">
                    我承诺：所有证据都是真实采集的，不捏造、不侵犯他人隐私，采集现场证据时注意安全，
                    公开资料会标明来源。
                  </span>
                </label>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">完成清单所需条件：</p>
                {[
                  { ok: membersOk, text: `组员名单已登记（${validMembers.length} 人）` },
                  { ok: lockedRowsComplete, text: `每位成员均有证据任务（${lockedRows.filter(r => r.item.trim()).length}/${lockedRows.length} 已填）` },
                  { ok: evidenceOk, text: `证据总数 ≥ 3 条（当前 ${evidenceCount} 条）` },
                  { ok: declaration, text: "安全承诺（勾选上方承诺）" },
                ].map((cond, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {cond.ok
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    }
                    <span className={cond.ok ? "text-green-700" : "text-muted-foreground"}>{cond.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 底部导航 */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => subStep > 0 ? setSubStep(s => s - 1) : navigate("/lesson/1/step/3")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> 上一步
          </Button>
          <div className="flex flex-col items-end gap-1">
            {subStep < SUB_STEPS.length - 1 ? (
              <>
                <Button
                  onClick={() => {
                    if (subStep === 0) handleNextFromMemberReg()
                    else { handleAutoSave(); setSubStep(s => s + 1) }
                  }}
                  disabled={
                    (subStep === 0 && !membersOk) ||
                    (subStep === 1 && isLeader && !evidenceOk)
                  }
                >
                  下一步 <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                {subStep === 0 && !membersOk && (
                  <p className="text-xs text-amber-600">
                    {!allOtherMembersFilled && otherMembers.length > 0
                      ? "请将所有组员姓名填写完整后再继续"
                      : "请至少填写 1 位组员姓名（或人数为0时你是唯一成员）"}
                  </p>
                )}
                {subStep === 1 && isLeader && !evidenceOk && (
                  <p className="text-xs text-amber-600">
                    {!lockedRowsComplete
                      ? `还有 ${lockedRows.filter(r => !r.item.trim()).length} 条锁定行未填写证据项`
                      : `还需添加 ${Math.max(0, 3 - evidenceCount)} 条任务行才能过关`
                    }
                  </p>
                )}
              </>
            ) : (
              <Button onClick={handleSaveAndNext} disabled={!canFinish || saving || !portfolio}>
                {saving ? "保存中..." : "完成清单，进入下一关"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 右侧 AI 面板 */}
      {portfolio && aiOpen && (
        <div className="w-80 flex-shrink-0">
          <AIHelperDrawer
            open={aiOpen}
            onClose={() => setAiOpen(false)}
            kind="R3"
            portfolio={portfolio}
            onSave={savePortfolio}
            contextSummary={contextSummary}
          />
        </div>
      )}
    </div>
  )
}

// ── 单行卡片组件（锁定行 vs 新增行共用） ──
interface EvidenceRowCardProps {
  ev: GroupEvidencePlanRow
  idx: number
  isLeader: boolean
  isLocked: boolean
  validMembers: string[]
  myName: string
  readonlyCls: string
  onChange: (patch: Partial<GroupEvidencePlanRow>) => void
  onRemove?: () => void
}

function EvidenceRowCard({ ev, isLeader, isLocked, validMembers, myName, readonlyCls, onChange, onRemove }: EvidenceRowCardProps) {
  const fieldReadonly = !isLeader // 证据项/类型/地点/方法：组长始终可编辑（包括锁定行），组员只读

  /** 负责人区：单行横排（锁定行为姓名+锁标；新增行为多选气泡可横向滚动） */
  const ownerRow = isLocked ? (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
      <Badge variant={ev.owners[0] === myName ? "default" : "outline"} className="text-xs font-normal">
        {ev.owners[0] ?? "—"}
        {ev.owners[0] === myName ? "（你）" : ""}
      </Badge>
    </div>
  ) : isLeader ? (
    <div className="inline-flex flex-nowrap items-center gap-1 min-w-0 max-w-full overflow-x-auto pb-0.5">
      {validMembers.map(member => (
        <button
          key={member}
          type="button"
          onClick={() => {
            const next = ev.owners.includes(member)
              ? ev.owners.filter(o => o !== member)
              : [...ev.owners, member]
            onChange({ owners: next })
          }}
          className={`text-xs px-2 py-0.5 rounded-full border transition-all cursor-pointer shrink-0 ${
            ev.owners.includes(member)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:border-primary text-muted-foreground"
          }`}
        >
          {member}
        </button>
      ))}
      {validMembers.length === 0 && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">请先在组员登记步骤添加成员</span>
      )}
    </div>
  ) : (
    <div className="inline-flex flex-nowrap items-center gap-1 min-w-0 max-w-full overflow-x-auto pb-0.5">
      {ev.owners.length > 0
        ? ev.owners.map(o => (
          <Badge key={o} variant={o === myName ? "default" : "outline"} className="text-xs shrink-0 font-normal">
            {o}{o === myName ? "（你）" : ""}
          </Badge>
        ))
        : <span className="text-xs text-muted-foreground whitespace-nowrap">未分配</span>}
    </div>
  )

  return (
    <div className={`border rounded-lg p-4 xl:p-3 relative flex flex-col ${isLocked ? "bg-muted/10 border-dashed" : ""}`}>
      {!isLocked && onRemove && (
        <Button
          variant="ghost" size="icon"
          className="h-6 w-6 absolute top-2 right-2 z-[1]"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}

      {/* 左上角：负责人标签与内容同一行 */}
      <div className="flex items-center gap-2 mb-3 xl:mb-2 pr-8 min-h-[1.75rem]">
        <span className="text-xs font-medium text-muted-foreground shrink-0">负责人</span>
        {!isLocked && isLeader && ev.owners.length === 0 && (
          <span className="text-xs text-amber-500 shrink-0">（请选择）</span>
        )}
        <div className="flex-1 min-w-0 flex items-center">{ownerRow}</div>
      </div>

      {/* 小屏两列多行；xl 起主字段同一行占满内容区宽度（不含负责人） */}
      <div className="grid grid-cols-2 xl:grid-cols-12 gap-3 xl:gap-2 xl:items-end">
        <div className="space-y-1 xl:col-span-3">
          <label className="text-xs font-medium text-muted-foreground">证据项 *</label>
          <Input
            placeholder="例：学校门口分贝读数"
            value={ev.item}
            readOnly={fieldReadonly}
            onChange={isLeader ? e => onChange({ item: e.target.value }) : undefined}
            className={!isLeader ? readonlyCls : ""}
          />
        </div>
        <div className="space-y-1 xl:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">类型</label>
          <select
            value={ev.type}
            disabled={!isLeader}
            onChange={isLeader ? e => onChange({ type: e.target.value as "first-hand" | "second-hand" }) : undefined}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${!isLeader ? "opacity-70 cursor-default" : ""}`}
          >
            <option value="first-hand">现场采集</option>
            <option value="second-hand">公开资源</option>
          </select>
        </div>
        <div className="space-y-1 xl:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">地点与时间</label>
          <Input
            placeholder="例：学校门口，周一7:30"
            value={ev.whereWhen}
            readOnly={!isLeader}
            onChange={isLeader ? e => onChange({ whereWhen: e.target.value }) : undefined}
            className={!isLeader ? readonlyCls : ""}
          />
        </div>
        <div className="space-y-1 xl:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">方法与工具</label>
          <Input
            placeholder="例：分贝计App + 手机"
            value={ev.method}
            readOnly={!isLeader}
            onChange={isLeader ? e => onChange({ method: e.target.value }) : undefined}
            className={!isLeader ? readonlyCls : ""}
          />
        </div>
        <div className="space-y-1 xl:col-span-3">
          <label className="text-xs font-medium text-muted-foreground">记录思路</label>
          <Input
            placeholder="例：先记时间地点，再补读数"
            value={ev.recordIdea}
            readOnly={!isLeader}
            onChange={isLeader ? e => onChange({ recordIdea: e.target.value }) : undefined}
            className={!isLeader ? readonlyCls : ""}
          />
        </div>
      </div>

      {/* 锁定行说明置于卡片底部（仅组长可见） */}
      {isLocked && isLeader && (
        <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-dashed border-border/80 flex items-start gap-1.5">
          <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
          <span>此行负责人已锁定；若要调整，请返回「组员登记」修改人数或姓名，系统会同步删除对应行。</span>
        </p>
      )}
    </div>
  )
}
