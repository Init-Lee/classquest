/**
 * 文件说明：模块 2 图片资产开发测试页（仅开发环境，路由 /module/2/dev/assets）。
 * 职责：在独立的“开发夹具档案”（来源标为教学样例、不设为活动档案）上验证图片资产服务：选图上传 → 显示主图 / 原图尺寸与字节数及是否去重 → 刷新后从本机库重建预览 → 列出全部版本；
 *       不切换、不写入学生活动档案。开发页允许出现技术词。
 * 更新触发：图片资产服务接口、开发夹具档案结构或开发验收项（M09/M18）变化时，需要同步更新本文件；生产构建不得包含本页。
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import {
  createEmptyStudentIdentity,
  createNewModule2Portfolio,
  type Module2PortfolioV1,
  type Module2StoredAsset,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import {
  cacheModule2Thumbnail,
  getModule2ThumbnailUrl,
  Module2ImageError,
  prepareModule2Image,
  saveModule2ImageVersion,
} from "@/modules/module-2-ai-comic/features/assets/asset-service"
import {
  module2AssetRepository,
  module2PortfolioRepository,
} from "@/modules/module-2-ai-comic/infra/persistence/module2-persistence"

const DEV_FIXTURE_ID = "module2-dev-assets-fixture"
const DEV_SOURCE_ID = "module2-dev-assets-source"

interface UploadLog {
  file: string
  ok: boolean
  text: string
}

interface VersionRow {
  id: string
  note: string
  thumbUrl: string | null
  main: Module2StoredAsset | null
  original: Module2StoredAsset | null
}

function createDevFixture(): Module2PortfolioV1 {
  const now = new Date().toISOString()
  const base = createNewModule2Portfolio(createEmptyStudentIdentity(), now)
  return {
    ...base,
    id: DEV_FIXTURE_ID,
    sourceSnapshot: {
      id: DEV_SOURCE_ID,
      origin: "manual",
      filename: null,
      sourceFileSha256: null,
      importedAt: now,
      studentConfirmedAt: now,
      sourceConfirmedAt: null,
      student: createEmptyStudentIdentity(),
      storyTitle: "开发夹具（教学样例）",
      parts: { opening: "起", development: "承", turn: "转", ending: "合" },
      isTeachingSample: true,
      importNote: "开发测试页自动生成，不代表学生来源",
    },
  }
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

function describe(asset: Module2StoredAsset | null): string {
  if (!asset) return "（本机未找到）"
  return `${asset.mime} ${asset.width}×${asset.height} ${kb(asset.byteLength)} ${asset.assetId.slice(0, 15)}…`
}

export default function Module2AssetsDevPage() {
  const { isTeacherMode, portfolio: activePortfolio } = useModule2State()
  const [fixture, setFixture] = useState<Module2PortfolioV1 | null>(null)
  const [rows, setRows] = useState<VersionRow[]>([])
  const [logs, setLogs] = useState<UploadLog[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const urlsRef = useRef<string[]>([])

  const refresh = useCallback(async (current: Module2PortfolioV1) => {
    const next: VersionRow[] = []
    const urls: string[] = []
    for (const version of current.imageVersions) {
      const [main, original, thumbUrl] = await Promise.all([
        module2AssetRepository.getAsset(version.mainAssetId),
        module2AssetRepository.getAsset(version.originalAssetId),
        getModule2ThumbnailUrl(module2AssetRepository, version.mainAssetId),
      ])
      if (thumbUrl) urls.push(thumbUrl)
      next.push({ id: version.id, note: version.note, thumbUrl, main, original })
    }
    urlsRef.current.forEach(url => URL.revokeObjectURL(url))
    urlsRef.current = urls
    setRows(next)
    setActiveId(await module2PortfolioRepository.getActivePortfolioId())
  }, [])

  useEffect(() => {
    if (isTeacherMode) return
    let cancelled = false
    void (async () => {
      try {
        let loaded = await module2PortfolioRepository.getPortfolio(DEV_FIXTURE_ID)
        if (!loaded) {
          const created = createDevFixture()
          const saved = await module2PortfolioRepository.savePortfolio(created, { activate: false })
          loaded = { ...created, revision: saved.revision }
        }
        if (cancelled) return
        setFixture(loaded)
        await refresh(loaded)
      } catch (cause) {
        console.error("[module2 dev assets] load failed", cause)
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
    return () => { cancelled = true }
  }, [isTeacherMode, refresh])

  useEffect(() => () => urlsRef.current.forEach(url => URL.revokeObjectURL(url)), [])

  const handleFiles = async (files: FileList | null) => {
    if (!files || !fixture) return
    setBusy(true)
    let current = fixture
    for (const file of Array.from(files)) {
      try {
        const prepared = await prepareModule2Image(file)
        const result = await saveModule2ImageVersion(module2PortfolioRepository, current, prepared, {
          slot: "other",
          sourceSnapshotId: DEV_SOURCE_ID,
          note: file.name,
        }, { activate: false })
        current = result.portfolio
        await cacheModule2Thumbnail(module2AssetRepository, prepared.main.assetId, prepared.thumbnail)
        setLogs(prev => [{
          file: file.name,
          ok: true,
          text: `已保存（revision ${result.portfolio.revision}）。原图 ${describe(prepared.original)}；主图 ${prepared.mainIsOriginal ? "= 原图（未缩小，共用一份）" : describe(prepared.main)}；`
            + `缩略图 ${prepared.thumbnail.width}×${prepared.thumbnail.height}；新写入 ${result.writtenAssetIds.length} 个资产，去重复用 ${result.reusedAssetIds.length} 个`,
        }, ...prev])
      } catch (cause) {
        const message = cause instanceof Module2ImageError || cause instanceof Error ? cause.message : String(cause)
        console.error("[module2 dev assets] upload failed", cause)
        setLogs(prev => [{ file: file.name, ok: false, text: `未保存：${message}` }, ...prev])
      }
    }
    setFixture(current)
    await refresh(current)
    setBusy(false)
  }

  if (isTeacherMode) {
    return <p className="py-20 text-center text-sm text-muted-foreground">教师讲解模式下不访问本机数据库，开发测试页已停用。</p>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Card className="border-dashed border-amber-400">
        <CardHeader>
          <CardTitle className="text-lg">[DEV] 模块二图片资产开发测试页</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>夹具档案 <code>{DEV_FIXTURE_ID}</code>（来源 isTeachingSample=true），不会设为活动档案。</p>
          <p>
            当前 activePortfolioId：<code data-testid="active-portfolio-id">{activeId ?? "null"}</code>
            {activePortfolio && <>（学生档案 revision {activePortfolio.revision}）</>}
          </p>
          <p>夹具 revision：<code>{fixture?.revision ?? "-"}</code>；版本数：<code data-testid="version-count">{fixture?.imageVersions.length ?? 0}</code>；库存资产数：<code>{fixture?.assetIds.length ?? 0}</code></p>
          {error && <p className="text-red-600">加载失败：{error}</p>}
          <label className="flex items-center gap-3 pt-2">
            <span className="font-medium text-foreground">选择图片（可多选，串行处理）</span>
            <input
              type="file"
              multiple
              disabled={busy || !fixture}
              data-testid="dev-asset-input"
              onChange={(event) => { void handleFiles(event.target.files); event.target.value = "" }}
            />
          </label>
          {busy && <p>处理中…</p>}
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">本次上传结果</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs" data-testid="upload-logs">
              {logs.map((log, index) => (
                <li key={`${log.file}-${index}`} className={log.ok ? "text-green-700" : "text-red-600"}>
                  <span className="font-medium">{log.file}</span>：{log.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">全部版本（从本机库重建预览）</CardTitle>
          <Button variant="outline" size="sm" disabled={!fixture} onClick={() => fixture && void refresh(fixture)}>重新读取</Button>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无版本。</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map(row => (
                <li key={row.id} className="space-y-1 rounded border p-2 text-xs">
                  {row.thumbUrl
                    ? <img src={row.thumbUrl} alt={`版本 ${row.note} 的缩略图`} className="h-40 w-full rounded bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:16px_16px] object-contain" />
                    : <div className="flex h-40 items-center justify-center bg-muted">无法读取图片</div>}
                  <p className="font-medium">{row.note}</p>
                  <p>主图：{describe(row.main)}</p>
                  <p>原图：{row.main && row.original && row.main.assetId === row.original.assetId ? "与主图相同" : describe(row.original)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
