/**
 * 文件说明：课时一样例素材缺失提示。
 * 职责：当静态样例清单或图片读不到时，列出缺的文件名，并保留页面上已有的文字与学生输入。
 * 更新触发：缺素材时给学生看的说明变化时，需要同步更新本文件。
 */

export function SampleMissingNotice({ message, missing }: { message: string; missing: string[] }) {
  return (
    <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <p>{message}</p>
      {missing.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {missing.map(file => <li key={file} className="break-all">缺少素材：{file}</li>)}
        </ul>
      )}
    </div>
  )
}
