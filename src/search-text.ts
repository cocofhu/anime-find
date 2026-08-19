export interface RenderedSearchItem {
  id: string
  title: string
  score?: number
  sources: string[]
  cover?: string
}

/** Keep in sync with parseRenderedSearch in src/client.js. */
export const SEARCH_ITEM_RE = /^\d+\.\s+(.+?)(?:\s+★([\d.]+))?\s+\[([^\]]+)\]\s*\n\s+id:\s+(\S+)(?:\s*\n\s+cover:\s+(\S+))?/gm

export function httpCoverUrl(value: string | undefined): string | undefined {
  const url = String(value || '').trim()
  return /^https?:\/\/\S+$/i.test(url) ? url : undefined
}

export function formatSearchItem(
  index: number,
  item: { title: string; score?: number; sources: string[]; id: string; cover?: string },
): string {
  const score = item.score != null ? ` ★${item.score.toFixed(1)}` : ''
  const cover = httpCoverUrl(item.cover)
  const coverLine = cover ? `\n   cover: ${cover}` : ''
  return `${index}. ${item.title}${score} [${item.sources.join('+')}]\n   id: ${item.id}${coverLine}`
}

export function parseRenderedSearch(text: string): { kind: 'anime-find-search'; items: RenderedSearchItem[] } | null {
  if (!text) return null
  const items: RenderedSearchItem[] = []
  const re = new RegExp(SEARCH_ITEM_RE.source, SEARCH_ITEM_RE.flags)
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    items.push({
      id: match[4],
      title: match[1].trim(),
      score: match[2] ? Number(match[2]) : undefined,
      sources: match[3].split(/[+/,]/).map((source) => source.trim()).filter(Boolean),
      cover: httpCoverUrl(match[5]),
    })
  }
  return items.length ? { kind: 'anime-find-search', items } : null
}
