/**
 * 文件说明：模块 4 课时 3 中文输入安全草稿 hook。
 * 职责：让工作台 Input/Textarea 在中文 IME 组合输入期间只更新本地草稿，组合结束后再提交到题卡状态。
 * 更新触发：课时 3 文本输入提交时机、IME 兼容策略或工作台字段同步规则变化时，需要同步更新本文件。
 */

import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, CompositionEvent, FocusEvent } from "react"

type TextFieldElement = HTMLInputElement | HTMLTextAreaElement

export function useImeSafeDraftValue({
  value,
  onCommit,
}: {
  value: string
  onCommit: (nextValue: string) => void
}) {
  const [draftValue, setDraftValue] = useState(value)
  const isComposingRef = useRef(false)
  const lastCommittedValueRef = useRef(value)

  useEffect(() => {
    lastCommittedValueRef.current = value
    if (!isComposingRef.current) {
      setDraftValue(value)
    }
  }, [value])

  const commitValue = (nextValue: string) => {
    if (nextValue === lastCommittedValueRef.current) return
    lastCommittedValueRef.current = nextValue
    onCommit(nextValue)
  }

  const handleChange = (event: ChangeEvent<TextFieldElement>) => {
    const nextValue = event.target.value
    setDraftValue(nextValue)
    if (!isComposingRef.current) {
      commitValue(nextValue)
    }
  }

  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = (event: CompositionEvent<TextFieldElement>) => {
    const nextValue = event.currentTarget.value
    isComposingRef.current = false
    setDraftValue(nextValue)
    commitValue(nextValue)
  }

  const handleBlur = (event: FocusEvent<TextFieldElement>) => {
    if (!isComposingRef.current) {
      commitValue(event.currentTarget.value)
    }
  }

  return {
    value: draftValue,
    onChange: handleChange,
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onBlur: handleBlur,
  }
}
