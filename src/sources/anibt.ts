import { fetchJson, formatSize } from '../http.js'
import type { AnimeCard, PluginConfig, Subgroup } from '../types.js'

interface AniBTList {
  ok?: boolean
  data?: {
    byWeekday?: Array<{
      weekdayLabel?: string
      animes?: Array<{
        animeId?: string
        bgmId?: number | string
        cover?: string
        rating?: number
        format?: string
        rssReleaseCount?: number
        title?: { chinese?: string; primary?: string; english?: string }
      }>
    }>
  }
}

interface AniBTGroups {
  ok?: boolean
  data?: {
    groups?: Array<{
      name?: string
      slug?: string
      lastUpdatedAt?: number
      items?: Array<{
        title?: string
        magnet?: string
        size?: number
        formatSize?: string
        publishedAt?: number
        resolution?: string
      }>
    }>
  }
}

export async function searchAniBT(
  query: string,
  config: PluginConfig,
  signal?: AbortSignal,
  season = '',
): Promise<AnimeCard[]> {
  const host = config.anibtHost.replace(/\/$/, '')
  const params = new URLSearchParams()
  params.set('query', query)
  if (season) params.set('season', season)
  const url = `${host}/api/seasons/anime?${params.toString()}`
  const wrap = await fetchJson<AniBTList>(url, { timeoutMs: config.timeoutMs, userAgent: config.userAgent }, signal)
  const items: AnimeCard[] = []
  for (const day of wrap.data?.byWeekday || []) {
    for (const a of day.animes || []) {
      const title = a.title?.chinese || a.title?.primary || a.title?.english || ''
      if (!title) continue
      const nameOrig = [a.title?.primary, a.title?.english].find((name) => name && name !== title)
      const bgmId = a.bgmId != null ? String(a.bgmId) : ''
      items.push({
        id: bgmId ? `anibt:${bgmId}` : `anibt:${a.animeId || title}`,
        title,
        cover: a.cover,
        score: typeof a.rating === 'number' && a.rating > 0 ? a.rating : undefined,
        bgmId: bgmId || undefined,
        nameOrig,
        format: a.format || 'tv',
        resourceCount: typeof a.rssReleaseCount === 'number' && a.rssReleaseCount > 0 ? a.rssReleaseCount : undefined,
        sources: ['anibt'],
        refs: { anibt: bgmId || a.animeId || title },
      })
    }
  }
  return items
}

export async function detailAniBT(bgmId: string, config: PluginConfig, signal?: AbortSignal): Promise<Subgroup[]> {
  const host = config.anibtHost.replace(/\/$/, '')
  const url = `${host}/api/anime/groups?bgmId=${encodeURIComponent(bgmId)}`
  const wrap = await fetchJson<AniBTGroups>(url, { timeoutMs: config.timeoutMs, userAgent: config.userAgent }, signal)
  return (wrap.data?.groups || []).map((g) => ({
    label: g.name || '未知字幕组',
    source: 'anibt' as const,
    updateDay: g.lastUpdatedAt ? new Date(g.lastUpdatedAt).toISOString().slice(0, 16).replace('T', ' ') : undefined,
    rss: g.slug
      ? `${host}/rss/anime.xml?bgmId=${encodeURIComponent(bgmId)}&groupSlug=${encodeURIComponent(g.slug)}`
      : undefined,
    items: (g.items || []).map((it) => ({
      title: it.title || '',
      size: it.formatSize || (typeof it.size === 'number' ? formatSize(it.size) : undefined),
      createdAt: it.publishedAt ? new Date(it.publishedAt).toISOString().slice(0, 16).replace('T', ' ') : undefined,
      magnet: it.magnet || undefined,
    })),
  }))
}
