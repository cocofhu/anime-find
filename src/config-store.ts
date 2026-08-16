import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { isPrivateOrLocalHost } from './streaming.js'
import type { PluginConfig, SourceId, StreamRule } from './types.js'

export const DEFAULT_SOURCES: SourceId[] = ['mikan']

const ALLOWED: SourceId[] = ['mikan', 'anibt', 'garden']

export function overlayPath(): string {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, 'anime-find.json')
}

export function sanitizeSources(raw: unknown): SourceId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SOURCES]
  const out = raw.map(String).filter((s): s is SourceId => ALLOWED.includes(s as SourceId))
  return out.length ? [...new Set(out)] : [...DEFAULT_SOURCES]
}

export function publicConfig(cfg: PluginConfig): Omit<PluginConfig, 'userAgent'> {
  return {
    mikanHost: cfg.mikanHost,
    anibtHost: cfg.anibtHost,
    gardenHost: cfg.gardenHost,
    timeoutMs: cfg.timeoutMs,
    maxResults: cfg.maxResults,
    sources: [...cfg.sources],
    streamEnabled: cfg.streamEnabled,
    streamRules: cfg.streamRules.map((rule) => ({ ...rule, headers: rule.headers ? { ...rule.headers } : undefined })),
  }
}

export function readOverlay(): Partial<PluginConfig> {
  try {
    const raw = JSON.parse(readFileSync(overlayPath(), 'utf8')) as Record<string, unknown>
    return sanitizePatch(raw)
  } catch {
    return {}
  }
}

export function writeOverlay(cfg: PluginConfig): void {
  const path = overlayPath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(publicConfig(cfg), null, 2)}\n`)
}

export function sanitizePatch(raw: Record<string, unknown>): Partial<PluginConfig> {
  const out: Partial<PluginConfig> = {}
  if (typeof raw.mikanHost === 'string' && raw.mikanHost.trim()) out.mikanHost = raw.mikanHost.trim()
  if (typeof raw.anibtHost === 'string' && raw.anibtHost.trim()) out.anibtHost = raw.anibtHost.trim()
  if (typeof raw.gardenHost === 'string' && raw.gardenHost.trim()) out.gardenHost = raw.gardenHost.trim()
  if (typeof raw.userAgent === 'string' && raw.userAgent.trim()) out.userAgent = raw.userAgent.trim()
  const timeout = Number(raw.timeoutMs)
  if (Number.isFinite(timeout) && timeout >= 3000) out.timeoutMs = Math.min(timeout, 120000)
  const max = Number(raw.maxResults)
  if (Number.isFinite(max) && max >= 1) out.maxResults = Math.min(Math.floor(max), 80)
  if (raw.sources !== undefined) out.sources = sanitizeSources(raw.sources)
  if (typeof raw.streamEnabled === 'boolean') out.streamEnabled = raw.streamEnabled
  if (raw.streamRules !== undefined) out.streamRules = sanitizeStreamRules(raw.streamRules)
  return out
}

export function assignConfig(live: PluginConfig, patch: Partial<PluginConfig>): PluginConfig {
  if (patch.mikanHost) live.mikanHost = patch.mikanHost
  if (patch.anibtHost) live.anibtHost = patch.anibtHost
  if (patch.gardenHost) live.gardenHost = patch.gardenHost
  if (patch.userAgent) live.userAgent = patch.userAgent
  if (patch.timeoutMs != null) live.timeoutMs = patch.timeoutMs
  if (patch.maxResults != null) live.maxResults = patch.maxResults
  if (patch.sources?.length) live.sources = [...patch.sources]
  if (patch.streamEnabled != null) live.streamEnabled = patch.streamEnabled
  if (patch.streamRules) live.streamRules = patch.streamRules.map((rule) => ({ ...rule }))
  return live
}

export function sanitizeStreamRules(raw: unknown): StreamRule[] {
  if (!Array.isArray(raw)) return []
  return raw
    .slice(0, 20)
    .map((value, index) => sanitizeStreamRule(value, index))
    .filter((value): value is StreamRule => !!value)
}

function sanitizeStreamRule(raw: unknown, index: number): StreamRule | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const value = raw as Record<string, unknown>
  const strings = ['name', 'baseURL', 'searchURL', 'searchList', 'searchName', 'searchResult', 'chapterRoads', 'chapterResult'] as const
  const out: Record<string, unknown> = {}
  for (const key of strings) {
    if (typeof value[key] !== 'string' || !value[key].trim()) return undefined
    out[key] = value[key].trim()
  }
  try {
    const parsed = new URL(String(out.baseURL))
    if (!/^https?:$/.test(parsed.protocol) || isPrivateOrLocalHost(parsed.hostname)) return undefined
    out.baseURL = parsed.origin
  } catch {
    return undefined
  }
  out.id = typeof value.id === 'string' && value.id.trim() ? value.id.trim().slice(0, 80) : `rule-${index + 1}-${Date.now()}`
  out.enabled = value.enabled !== false
  for (const key of ['chapterName', 'playURL', 'playURLs'] as const) {
    if (typeof value[key] === 'string' && value[key].trim()) out[key] = value[key].trim()
  }
  if (value.useWebview === true) out.useWebview = true
  if (value.headers && typeof value.headers === 'object' && !Array.isArray(value.headers)) {
    out.headers = Object.fromEntries(Object.entries(value.headers).filter(([key, header]) =>
      /^[a-z0-9-]{1,64}$/i.test(key) && typeof header === 'string' && header.length < 1024,
    )) as Record<string, string>
  }
  return out as unknown as StreamRule
}
