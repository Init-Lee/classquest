/**
 * 文件说明：teacher-console demo 展示脱敏工具。
 * 职责：集中封装教师端 demo 账号下学生姓名、班级/座位等标识和短标题的最小展示层脱敏规则。
 * 更新触发：demo 角色判断、教师端隐私展示口径、学生身份字段或短标题脱敏规则变化时，需要同步更新本文件。
 */

import type { TeacherSession } from "@/teacher-console/types"

const COMMON_CHINESE_SURNAME_CHARS = "赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣邓郁单杭洪包诸左石崔吉龚程邢裴陆荣翁荀羊於惠甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘斜厉戎祖武符刘景詹束龙叶幸司韶郜黎蓟薄印宿白怀蒲邰从鄂索咸籍赖卓蔺屠蒙池乔阴胥能苍双闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍郤璩桑桂濮牛寿通边扈燕冀浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧利师巩聂关荆司游竺权逯盖益桓公"
const DEMO_NAME_CONTEXT_PATTERN = new RegExp(
  `(^|[\\s·:：,，;；/\\\\()[\\]{}<>《》"'“”‘’_-])([${COMMON_CHINESE_SURNAME_CHARS}][\\u4e00-\\u9fff]{1,3})(?=$|[\\s·:：,，;；/\\\\()[\\]{}<>《》"'“”‘’_.\\-…])`,
  "g",
)

export function shouldMaskTeacherDemo(session: TeacherSession | null): boolean {
  return session?.user.role === "demo"
}

export function maskDemoStudentName(name: string | null | undefined): string {
  const normalized = name?.trim() ?? ""
  if (!normalized) return "匿名学生"
  return `${Array.from(normalized)[0]}xx`
}

export function maskDemoIdentifier(value: string | null | undefined): string {
  const normalized = value?.trim() ?? ""
  if (!normalized) return ""

  const classMatch = normalized.match(/^(.*?级)\s*\d+\s*班$/)
  if (classMatch) return `${classMatch[1]} xx 班`

  if (/^\d+$/.test(normalized)) {
    const keepLength = normalized.length >= 6 ? 4 : Math.min(2, normalized.length)
    return `${normalized.slice(0, keepLength)}xx`
  }

  const alphaPrefixMatch = normalized.match(/^([A-Za-z]+)\d+$/)
  if (alphaPrefixMatch) return `${alphaPrefixMatch[1].slice(0, 1)}xx`

  const firstChar = Array.from(normalized)[0]
  return `${firstChar}xx`
}

export function maskDemoText(text: string | null | undefined): string {
  const normalized = text?.trim() ?? ""
  if (!normalized) return ""

  return normalized
    .replace(/(\d{1,2})\s*班(?=[\u4e00-\u9fffA-Za-z0-9])/g, (_, value: string) => `${value.slice(0, 1)}xx`)
    .replace(/\d+\s*班/g, "xx 班")
    .replace(DEMO_NAME_CONTEXT_PATTERN, (_, prefix: string, name: string) => `${prefix}${Array.from(name)[0]}xx`)
    .replace(/\b([A-Za-z])\d{2,}\b/g, "$1xx")
    .replace(/\b\d{6,}\b/g, value => `${value.slice(0, 4)}xx`)
    .replace(/\b\d{3,5}\b/g, value => `${value.slice(0, 2)}xx`)
}
