/**
 * 文件说明：模块 4 课时 4 V2 就绪检查清单组件。
 * 职责：在 Step4 中按分组展示单张 V2 题卡是否满足进入课时五的检查条件及说明文案。
 * 更新触发：Step4 检查项分组、阻塞标记、detail 文案或清单视觉样式变化时，需要同步更新本文件。
 */

import type { Lesson4CardReadinessReport } from "../../utils/evaluate-lesson4-ready-for-lesson5"

function CheckStatus({ passed, blocking }: { passed: boolean; blocking: boolean }) {
  const className = passed ? "text-green-700" : blocking ? "text-red-700" : "text-amber-700"
  const label = passed ? "通过" : blocking ? "阻塞" : "提醒"

  return <span className={className}>{label}</span>
}

export function V2ReadinessChecklist({ report }: { report: Lesson4CardReadinessReport }) {
  return (
    <div className="space-y-4">
      {report.checkSections.map(section => (
        <div key={section.title}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{section.title}</p>
          <ul className="space-y-2">
            {section.checks.map(check => (
              <li key={`${section.title}-${check.label}`} className="flex items-start gap-2 text-sm">
                <CheckStatus passed={check.passed} blocking={check.blocking} />
                <div>
                  <span className="text-foreground">{check.label}</span>
                  <p className="text-xs text-muted-foreground">{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
