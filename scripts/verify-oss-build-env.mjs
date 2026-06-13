/*
 * 文件说明：OSS 静态前端生产构建环境检查脚本。
 * 职责：在执行 Vite build 前校验 .env.production 中的前端公开变量，防止误用 fixture 模式或混入后端密钥变量。
 * 更新触发：OSS 构建所需 VITE_* 变量、生产 HTTP adapter 开关或禁止下发到浏览器的后端密钥命名发生变化时，需要同步更新本文件。
 */

import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const envPath = path.resolve(process.cwd(), ".env.production")

const requiredHttpVars = [
  "VITE_MODULE4_LESSON3_AI_REVIEW_MODE",
  "VITE_MODULE4_LESSON4_PEER_REVIEW_MODE",
  "VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE",
  "VITE_TEACHER_CONSOLE_MODE",
  "VITE_MODULE4_LESSON5_MODE",
  "VITE_MODULE4_LESSON6_MODE",
]

const requiredHttpsVars = ["VITE_API_BASE_URL"]

const forbiddenVars = new Set([
  "DASHSCOPE_API_KEY",
  "CLASSQUEST_TEACHER_PASSWORD",
  "QWEN_API_KEY",
  "VITE_MODULE4_LESSON5_FIXTURE_PHASE",
])

const forbiddenSecretNamePattern = /(?:^|_)(?:API_KEY|SECRET|PASSWORD|TOKEN)(?:$|_)/

function parseEnvLine(line) {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith("#")) {
    return null
  }

  const normalized = trimmed.startsWith("export ") ? trimmed.slice("export ".length).trim() : trimmed
  const separatorIndex = normalized.indexOf("=")

  if (separatorIndex === -1) {
    return null
  }

  const key = normalized.slice(0, separatorIndex).trim()
  const rawValue = normalized.slice(separatorIndex + 1).trim()

  if (!key) {
    return null
  }

  return {
    key,
    value: stripWrappingQuotes(rawValue),
  }
}

function stripWrappingQuotes(value) {
  if (value.length < 2) {
    return value
  }

  const first = value.at(0)
  const last = value.at(-1)

  if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
    return value.slice(1, -1)
  }

  return value
}

function formatList(items) {
  return items.map((item) => `  - ${item}`).join("\n")
}

function fail(messages) {
  console.error("[build:oss] 环境检查失败：")
  console.error(messages.join("\n"))
  process.exit(1)
}

if (!fs.existsSync(envPath)) {
  fail(["缺少 .env.production，请先从 .env.production.example 复制并补齐生产前端配置。"])
}

const envText = fs.readFileSync(envPath, "utf8")
const entries = envText
  .split(/\r?\n/)
  .map(parseEnvLine)
  .filter(Boolean)

const envMap = new Map(entries.map(({ key, value }) => [key, value]))
const keys = entries.map(({ key }) => key)
const errors = []

const missingHttpVars = requiredHttpVars.filter((key) => !envMap.has(key))
const nonHttpVars = requiredHttpVars.filter((key) => envMap.has(key) && envMap.get(key) !== "http")

if (missingHttpVars.length > 0) {
  errors.push(`缺少必须设置为 http 的变量：\n${formatList(missingHttpVars)}`)
}

if (nonHttpVars.length > 0) {
  errors.push(`以下变量必须设置为 http：\n${formatList(nonHttpVars)}`)
}

const missingHttpsVars = requiredHttpsVars.filter((key) => !envMap.has(key))
const nonHttpsVars = requiredHttpsVars.filter((key) => envMap.has(key) && !envMap.get(key).startsWith("https://"))

if (missingHttpsVars.length > 0) {
  errors.push(`缺少必须使用 HTTPS 的 API 变量：\n${formatList(missingHttpsVars)}`)
}

if (nonHttpsVars.length > 0) {
  errors.push(`以下 API 变量必须以 https:// 开头：\n${formatList(nonHttpsVars)}`)
}

const forbiddenDetected = keys.filter((key) => forbiddenVars.has(key) || forbiddenSecretNamePattern.test(key))

if (forbiddenDetected.length > 0) {
  errors.push(`生产前端 env 不允许包含这些后端密钥或 fixture 控制变量：\n${formatList([...new Set(forbiddenDetected)])}`)
}

if (errors.length > 0) {
  fail(errors)
}

console.log("[build:oss] 环境检查通过：.env.production 已满足 OSS 静态前端构建要求。")
console.log("[build:oss] 已检查变量：")
console.log(formatList([...requiredHttpVars, ...requiredHttpsVars]))
