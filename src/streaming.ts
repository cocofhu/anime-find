import * as cheerio from 'cheerio'
import { createHash } from 'node:crypto'
import type { PluginConfig, StreamEpisode, StreamQuality, StreamRule, StreamSource } from './types.js'

const MAX_SOURCES = 24
const MAX_EPISODES = 120
const STREAM_CONCURRENCY = 4
const MAX_REDIRECTS = 5

function id(...parts: string[]): string {
  return createHash('sha256').update(parts.join('\0')).digest('hex').slice(0, 24)
}

function absolute(base: string, value: string): string {
  return new URL(value, base).toString()
}

function xpathToCss(value: string, field: string): string {
  const expression = value.replace(/\/text\(\)\s*$/, '').trim()
  if (!expression.startsWith('//')) throw new Error(`${field} 的 XPath 必须以 // 开头`)
  const parts = expression.split(/(\/\/|\/)/).filter(Boolean)
  const output: string[] = []
  let combinator = ''

  for (const part of parts) {
    if (part === '//') {
      combinator = ' '
      continue
    }
    if (part === '/') {
      combinator = ' > '
      continue
    }
    const match = /^([a-z*][\w-]*)(?:\[(.+)\])?$/i.exec(part)
    if (!match) throw new Error(`${field} 含不支持的 XPath 片段：${part}`)
    const [, tag, predicate] = match
    let css = tag
    if (predicate) {
      if (/^\d+$/.test(predicate)) css += `:nth-of-type(${predicate})`
      else {
        const equals = /^@([\w-]+)\s*=\s*(['"])(.*?)\2$/.exec(predicate)
        const contains = /^contains\(\s*@([\w-]+)\s*,\s*(['"])(.*?)\2\s*\)$/.exec(predicate)
        const exists = /^@([\w-]+)$/.exec(predicate)
        if (equals) css += `[${equals[1]}="${escapeCssString(equals[3])}"]`
        else if (contains) css += `[${contains[1]}*="${escapeCssString(contains[3])}"]`
        else if (exists) css += `[${exists[1]}]`
        else throw new Error(`${field} 含不支持的 XPath 谓词：${predicate}`)
      }
    }
    output.push(`${output.length ? combinator || ' > ' : ''}${css}`)
    combinator = ' > '
  }
  return output.join('')
}

function escapeCssString(value: string): string {
  return value.replace(/["\\\n\r\f]/g, (character) => `\\${character}`)
}

function selector(rule: string, field: string): string {
  const value = String(rule || '').trim()
  if (!value) throw new Error(`${field} 不能为空`)
  return value.startsWith('//') ? xpathToCss(value, field) : value
}

export async function fetchAllowedStream(
  url: string,
  rule: StreamRule,
  cfg: PluginConfig,
  init: RequestInit = {},
): Promise<Response> {
  let current = url
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.min(cfg.timeoutMs, 15000))
  try {
    const headers = new Headers(init.headers)
    headers.set('user-agent', cfg.userAgent)
    headers.set('referer', rule.baseURL)
    for (const [key, value] of Object.entries(rule.headers || {})) headers.set(key, value)
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      if (!isAllowedForRule(current, rule)) throw new Error('流媒体地址不在当前规则允许域内')
      const res = await fetch(current, { ...init, headers, signal: controller.signal, redirect: 'manual' })
      if (![301, 302, 303, 307, 308].includes(res.status)) return res
      const location = res.headers.get('location')
      if (!location) throw new Error('源站重定向缺少地址')
      current = new URL(location, current).toString()
    }
    throw new Error(`源站重定向超过 ${MAX_REDIRECTS} 次`)
  } finally {
    clearTimeout(timer)
  }
}

async function getHtml(url: string, cfg: PluginConfig, rule?: StreamRule): Promise<string> {
  if (!rule) throw new Error('缺少流媒体规则')
  const res = await fetchAllowedStream(url, rule, cfg, {
    headers: {
      'user-agent': cfg.userAgent,
      accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) throw new Error(`源站返回 HTTP ${res.status}`)
  return await res.text()
}

function formatFrom(url: string): 'hls' | 'mp4' | 'unknown' {
  const clean = url.split('?')[0].toLowerCase()
  return clean.endsWith('.m3u8') ? 'hls' : clean.endsWith('.mp4') ? 'mp4' : 'unknown'
}

export function validateRule(raw: unknown): { rule: StreamRule; warning?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('规则必须是 JSON 对象')
  const rule = raw as StreamRule
  const required = ['name', 'baseURL', 'searchURL', 'searchList', 'searchName', 'searchResult', 'chapterRoads', 'chapterResult'] as const
  for (const key of required) if (!String(rule[key] || '').trim()) throw new Error(`规则缺少必要字段：${key}`)
  if (!/^https?:\/\//i.test(rule.baseURL)) throw new Error('baseURL 必须是 http 或 https 地址')
  for (const key of ['searchList', 'searchName', 'searchResult', 'chapterRoads', 'chapterResult'] as const) selector(String(rule[key]), key)
  return { rule, warning: rule.useWebview ? '该规则声明 useWebview；仅静态 XPath/CSS 解析可用，部分剧集可能无法播放。' : undefined }
}

export async function aggregateStreams(items: Array<{ title?: string; nameOrig?: string }>, cfg: PluginConfig): Promise<StreamSource[]> {
  if (!cfg.streamEnabled) return []
  const rules = cfg.streamRules.filter((rule) => rule.enabled)
  if (!rules.length) return []
  const tasks = items.slice(0, 12).flatMap((item) => rules.map((rule) => () => searchRule(item.title || item.nameOrig || '', rule, cfg)))
  const settled = await runWithConcurrency(tasks, STREAM_CONCURRENCY)
  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []).slice(0, MAX_SOURCES)
}

export async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length)
  let next = 0
  const worker = async () => {
    while (next < tasks.length) {
      const index = next++
      try {
        results[index] = { status: 'fulfilled', value: await tasks[index]() }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(limit, 1), tasks.length) }, worker))
  return results
}

async function searchRule(title: string, rule: StreamRule, cfg: PluginConfig): Promise<StreamSource[]> {
  if (!title || rule.useWebview) return []
  const searchUrl = absolute(rule.baseURL, rule.searchURL.replace(/\{\{\s*(?:keyword|query)\s*\}\}/gi, encodeURIComponent(title)))
  const $ = cheerio.load(await getHtml(searchUrl, cfg, rule))
  const rows = $(selector(rule.searchList, 'searchList')).toArray().slice(0, 5)
  const result: StreamSource[] = []
  for (const row of rows) {
    const nameNode = $(row).find(selector(rule.searchName, 'searchName')).first()
    const urlNode = $(row).find(selector(rule.searchResult, 'searchResult')).first()
    const name = nameNode.text().trim() || $(row).text().trim()
    const href = urlNode.attr('href') || $(row).attr('href')
    if (!href || !name) continue
    const sourceUrl = absolute(searchUrl, href)
    const episodes = await parseEpisodes(sourceUrl, rule, cfg)
    if (!episodes.length) continue
    result.push({
      id: id(rule.id, sourceUrl),
      animeTitle: title,
      ruleId: rule.id,
      ruleName: rule.name,
      lineName: name.slice(0, 80),
      sourceUrl,
      episodes,
      format: 'unknown',
      status: rule.playURL || rule.playURLs ? 'ready' : 'limited',
    })
  }
  return result
}

async function parseEpisodes(sourceUrl: string, rule: StreamRule, cfg: PluginConfig): Promise<StreamEpisode[]> {
  const $ = cheerio.load(await getHtml(sourceUrl, cfg, rule))
  return $(selector(rule.chapterRoads, 'chapterRoads')).toArray().slice(0, MAX_EPISODES).flatMap((node, index) => {
    const target = rule.chapterResult ? $(node).find(selector(rule.chapterResult, 'chapterResult')).first() : $(node)
    const href = target.attr('href') || $(node).attr('href')
    if (!href) return []
    const name = rule.chapterName ? $(node).find(selector(rule.chapterName, 'chapterName')).first().text().trim() : ''
    return [{ id: id(rule.id, sourceUrl, String(index), href), name: name || target.text().trim() || `第 ${index + 1} 集`, pageUrl: absolute(sourceUrl, href) }]
  })
}

export async function resolveStream(source: StreamSource, episode: StreamEpisode, rule: StreamRule, cfg: PluginConfig): Promise<StreamQuality[]> {
  if (!rule.enabled || !cfg.streamEnabled) throw new Error('流媒体功能或规则已关闭')
  if (!isAllowedForRule(source.sourceUrl, rule) || !isAllowedForRule(episode.pageUrl, rule)) {
    throw new Error('播放源或剧集地址不在当前规则允许域内')
  }
  const html = await getHtml(episode.pageUrl, cfg, rule)
  const $ = cheerio.load(html)
  const urls = rule.playURLs
    ? $(selector(rule.playURLs, 'playURLs')).toArray().map((node) => String($(node).attr('href') || $(node).attr('src') || '').trim())
    : [rule.playURL ? $(selector(rule.playURL, 'playURL')).first().attr('src') || $(selector(rule.playURL, 'playURL')).first().attr('href') || '' : '']
  const qualities = urls.filter(Boolean).map((value, index) => {
    const url = absolute(episode.pageUrl, value)
    const format = formatFrom(url)
    return { label: index === 0 ? '自动' : `线路 ${index + 1}`, url, format }
  }).filter((quality): quality is StreamQuality => quality.format !== 'unknown' && isAllowedForRule(quality.url, rule))
  if (!qualities.length) throw new Error('该集未解析出 MP4 或 HLS 播放地址')
  return qualities
}

export function isAllowedForRule(target: string, rule: StreamRule): boolean {
  try {
    const url = new URL(target)
    const base = new URL(rule.baseURL)
    return /^https?:$/.test(url.protocol) &&
      !isPrivateOrLocalHost(url.hostname) &&
      (url.hostname === base.hostname || url.hostname.endsWith(`.${base.hostname}`))
  } catch {
    return false
  }
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4) return false
  const octets = ipv4.slice(1).map(Number)
  if (octets.some((part) => part > 255)) return true
  return octets[0] === 0 || octets[0] === 10 || octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
}

export function isAllowedStreamUrl(target: string, cfg: PluginConfig): StreamRule | undefined {
  let url: URL
  try { url = new URL(target) } catch { return undefined }
  if (!/^https?:$/.test(url.protocol) || !cfg.streamEnabled) return undefined
  return cfg.streamRules.find((rule) => {
    if (!rule.enabled) return false
    return isAllowedForRule(url.toString(), rule)
  })
}
