import { fetchJson, formatSize } from '../http.js'
import type { AnimeCard, PluginConfig, Subgroup } from '../types.js'

interface GardenResource {
  id?: number | string
  title?: string
  magnet?: string
  size?: number
  createdAt?: string
  href?: string
  subjectId?: number | string
  fansub?: { id?: number | string; name?: string } | null
}

interface GardenWrap {
  status?: string
  resources?: GardenResource[]
}

export async function searchGarden(query: string, config: PluginConfig, signal?: AbortSignal): Promise<AnimeCard[]> {
  const host = config.gardenHost.replace(/\/$/, '')
  const url = `${host}/resources?keyword=${encodeURIComponent(query)}&pageSize=80&duplicate=false`
  const wrap = await fetchJson<GardenWrap>(url, { timeoutMs: config.timeoutMs, userAgent: config.userAgent }, signal)
  const groups = new Map<string, { title: string; count: number; fansub?: string; subjectId: string }>()
  for (const r of wrap.resources || []) {
    const sid = r.subjectId != null ? String(r.subjectId) : guessSubject(r.title || '', query)
    if (!sid) continue
    const display = seriesTitle(r.title || sid, query)
    const cur = groups.get(sid)
    if (!cur) {
      groups.set(sid, {
        subjectId: sid,
        title: seriesTitle(r.title || sid, query),
        count: 1,
        fansub: r.fansub?.name,
      })
    } else {
      cur.count += 1
      cur.fansub ||= r.fansub?.name
    }
  }
  return [...groups.values()]
    .filter((g) => g.count > 0 && (!query.trim() || g.title.includes(query.trim()) || g.subjectId.includes(query.trim())))
    .map((g) => ({
      id: `garden:${g.subjectId}`,
      title: g.title,
      subgroup: g.fansub,
      resourceCount: g.count,
      sources: ['garden'] as const,
      refs: { garden: g.subjectId },
      bgmId: /^\d+$/.test(g.subjectId) ? g.subjectId : undefined,
      format: 'tv',
    }))
}

export async function detailGarden(subjectId: string, config: PluginConfig, signal?: AbortSignal): Promise<Subgroup[]> {
  const host = config.gardenHost.replace(/\/$/, '')
  const key = subjectId.replace(/^title:/, '')
  const numeric = /^\d+$/.test(subjectId)
  const url = numeric
    ? `${host}/resources?subject=${encodeURIComponent(subjectId)}&pageSize=200&duplicate=false`
    : `${host}/resources?keyword=${encodeURIComponent(key)}&pageSize=200&duplicate=false`
  const wrap = await fetchJson<GardenWrap>(url, { timeoutMs: config.timeoutMs, userAgent: config.userAgent }, signal)
  const byFansub = new Map<string, Subgroup>()
  const order: string[] = []
  for (const r of wrap.resources || []) {
    const name = r.fansub?.name || '未知字幕组'
    const key = String(r.fansub?.id ?? name)
    let g = byFansub.get(key)
    if (!g) {
      g = { label: name, source: 'garden', items: [] }
      byFansub.set(key, g)
      order.push(key)
    }
    g.items.push({
      title: r.title || '',
      size: typeof r.size === 'number' ? formatSize(r.size) : undefined,
      createdAt: r.createdAt ? r.createdAt.replace('T', ' ').slice(0, 16) : undefined,
      magnet: r.magnet || undefined,
      torrent: r.href || undefined,
    })
    if (r.createdAt && (!g.updateDay || r.createdAt > g.updateDay)) g.updateDay = r.createdAt.replace('T', ' ').slice(0, 16)
  }
  return order.map((k) => byFansub.get(k)!).filter(Boolean)
}

export function seriesTitle(title: string, query?: string): string {
  const q = String(query || '').trim()
  if (q && title.includes(q)) return q
  const brackets = [...title.matchAll(/[【\[]([^】\]]+)[】\]]/g)].map((m) => m[1].trim()).filter(Boolean)
  const named = brackets.find((b) => !isMetaTag(b))
  const raw = named || stripBrackets(title) || title
  return cleanTitle(raw) || raw
}

function guessSubject(title: string, query?: string): string {
  const name = seriesTitle(title, query)
  if (!name || isMetaTag(name)) {
    const q = String(query || '').trim()
    return q ? `title:${q}` : ''
  }
  return `title:${name}`
}

function stripBrackets(title: string): string {
  return title.replace(/[【\[][^】\]]+[】\]]/g, ' ').replace(/\s+/g, ' ').trim()
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[（(].*$/, '')
    .replace(/\s+[A-Za-z][A-Za-z0-9:'!&.\-\s]{2,}$/, '')
    .replace(/\s*[-–]\s*\d{1,3}(\s|$).*$/, '')
    .trim()
}

function isMetaTag(s: string): boolean {
  const t = s.trim()
  if (!t || t.length <= 2) return true
  if (/^\d+([-~]\d+)?$/.test(t)) return true
  if (/^(web-?rip|bd-?rip|bd|dvd|sp|ova|oad|movie|tv|1080p|720p|2160p|480p|big5|gb|mp4|mkv|hevc|avc|x264|x265|ani|viutv)$/i.test(t)) return true
  if (/(新番|字幕|代理商|粤语|粵語|合集|内嵌|外挂)/.test(t) && t.length < 16) return true
  if (/^\d+月/.test(t)) return true
  return false
}
