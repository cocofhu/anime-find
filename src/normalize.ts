import type { AnimeCard, SourceId } from './types.js'

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[（(].*?[）)]/g, '')
    .replace(/[~～].*$/u, '')
    .replace(/第[一二三四五六七八九十\d]+季/g, '')
    .replace(/season\s*\d+/gi, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim()
}

export function mergeCards(lists: AnimeCard[][], limit: number, offset = 0): AnimeCard[] {
  const byKey = new Map<string, AnimeCard>()
  const order: string[] = []
  for (const list of lists) {
    for (const card of list) {
      const key = card.bgmId ? `bgm:${card.bgmId}` : `t:${normalizeTitle(card.title) || card.id}`
      const existing = byKey.get(key)
      if (!existing) {
        byKey.set(key, cloneCard(card))
        order.push(key)
        continue
      }
      absorbCard(existing, card)
    }
  }
  const merged = order.map((k) => byKey.get(k)!).filter(Boolean)
  const collapsed = collapseSameTitle(merged)
  fillMissingResourceCounts(collapsed)
  const ranked = diversify(
    collapsed.sort((a, b) => (b.sources.length - a.sources.length) || (b.score ?? 0) - (a.score ?? 0)),
    collapsed.length,
  )
  const start = Math.max(0, Math.floor(offset))
  return ranked.slice(start, start + limit)
}

function cloneCard(card: AnimeCard): AnimeCard {
  return {
    ...card,
    sources: [...card.sources],
    refs: { ...card.refs },
    resourceCount: positiveCount(card.resourceCount),
    tags: card.tags ? [...card.tags] : undefined,
  }
}

function absorbCard(existing: AnimeCard, card: AnimeCard): void {
  existing.sources = unique([...existing.sources, ...card.sources])
  existing.refs = { ...card.refs, ...existing.refs }
  if (card.sources.includes('mikan') && !existing.id.startsWith('mikan:')) existing.id = card.id
  existing.cover ||= card.cover
  existing.score ??= card.score
  existing.pageUrl ||= card.pageUrl
  existing.bgmId ||= card.bgmId
  existing.nameOrig ||= card.nameOrig
  existing.ratingCount ??= card.ratingCount
  if (!existing.tags?.length && card.tags?.length) existing.tags = [...card.tags]
  existing.season ||= card.season
  existing.subgroup ||= card.subgroup
  existing.format ||= card.format
  const count = addCounts(existing.resourceCount, card.resourceCount)
  if (count != null) existing.resourceCount = count
  else delete existing.resourceCount
  if (card.title.length < existing.title.length) existing.title = card.title
}

/** Same display title (一拳超人) can exist as bgm:* and t:* keys; fold them so counts stick. */
function collapseSameTitle(cards: AnimeCard[]): AnimeCard[] {
  const byTitle = new Map<string, AnimeCard>()
  const out: AnimeCard[] = []
  for (const card of cards) {
    const key = card.title.trim()
    const existing = byTitle.get(key)
    if (!existing) {
      byTitle.set(key, card)
      out.push(card)
      continue
    }
    absorbCard(existing, card)
  }
  return out
}

function fillMissingResourceCounts(cards: AnimeCard[]): void {
  const donors = cards.filter((c) => positiveCount(c.resourceCount) != null)
  for (const card of cards) {
    if (positiveCount(card.resourceCount) != null) continue
    const hit = donors.find((other) => other.title.trim() === card.title.trim())
    if (hit) card.resourceCount = hit.resourceCount
  }
}

export function positiveCount(n: number | undefined): number | undefined {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined
}

function addCounts(a: number | undefined, b: number | undefined): number | undefined {
  const x = positiveCount(a)
  const y = positiveCount(b)
  if (x == null && y == null) return undefined
  return (x ?? 0) + (y ?? 0)
}

function diversify(cards: AnimeCard[], limit: number): AnimeCard[] {
  const buckets = new Map<string, AnimeCard[]>()
  for (const card of cards) {
    const key = card.sources[0] || 'other'
    const list = buckets.get(key) ?? []
    list.push(card)
    buckets.set(key, list)
  }
  const out: AnimeCard[] = []
  const used = new Set<string>()
  let i = 0
  while (out.length < limit) {
    let added = false
    for (const list of buckets.values()) {
      const card = list[i]
      if (!card || used.has(card.id)) continue
      used.add(card.id)
      out.push(card)
      added = true
      if (out.length >= limit) break
    }
    if (!added) break
    i += 1
  }
  return out
}

export function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)]
}

export function parseId(id: string): { source?: SourceId; key: string } {
  const i = id.indexOf(':')
  if (i <= 0) return { key: id }
  const source = id.slice(0, i) as SourceId
  if (source === 'mikan' || source === 'anibt' || source === 'garden') {
    return { source, key: id.slice(i + 1) }
  }
  return { key: id }
}
