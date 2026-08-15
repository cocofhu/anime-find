/** Vague “what’s good recently” prompts should list the current season, not keyword-search the sentence. */
export function isSeasonBrowse(query: string): boolean {
  const stripped = String(query || '')
    .replace(/最近|近期|本季|这季|当季|这一季|这个季度|这一季的/g, '')
    .replace(/有哪些|有什么|推荐一下|推荐|热播|热门|好看的|好看|流行的|新出的|最新/g, '')
    .replace(/还有吗|还有没有|还有别的|还有其他|再来一些|再来点|再推荐|换一批|多来点|更多/g, '')
    .replace(/动漫|番剧|动画|新番|番|动画作品/g, '')
    .replace(/[?？!！。,.，、\s]/g, '')
    .trim()
  return stripped.length < 2
}

export type AnimeSeasonName = '春' | '夏' | '秋' | '冬'

export interface AnimeSeason {
  year: number
  season: AnimeSeasonName
}

const CN_TZ = 'Asia/Shanghai'

export function shanghaiParts(now = new Date()): { year: number; month: number; day: number; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: CN_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const map: Record<string, string> = {}
  for (const part of fmt.formatToParts(now)) {
    if (part.type !== 'literal') map[part.type] = part.value
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  }
}

export function seasonOfMonth(month: number): AnimeSeasonName {
  if (month === 12 || month <= 2) return '冬'
  if (month <= 5) return '春'
  if (month <= 8) return '夏'
  return '秋'
}

export function currentAnimeSeason(now = new Date()): AnimeSeason {
  const { year, month } = shanghaiParts(now)
  return { year, season: seasonOfMonth(month) }
}

export function seasonLabel(s: AnimeSeason): string {
  return `${s.year}${s.season}`
}

export function parseSeasonHint(query: string): AnimeSeason | null {
  const q = String(query || '').trim()
  const named = q.match(/(\d{4})\s*年?\s*(春|夏|秋|冬)/)
  if (named) return { year: Number(named[1]), season: named[2] as AnimeSeasonName }
  const en = q.match(/(\d{4})\s*(spring|summer|autumn|fall|winter)/i)
  if (en) {
    const map: Record<string, AnimeSeasonName> = {
      spring: '春',
      summer: '夏',
      autumn: '秋',
      fall: '秋',
      winter: '冬',
    }
    return { year: Number(en[1]), season: map[en[2].toLowerCase()] }
  }
  const ym = q.match(/(\d{4})\s*[-/年]\s*(\d{1,2})\s*月?/)
  if (ym) {
    const month = Number(ym[2])
    if (month >= 1 && month <= 12) return { year: Number(ym[1]), season: seasonOfMonth(month) }
  }
  return null
}

/** Host clock first; explicit “2026夏” wins; vague 最近/本季 uses Asia/Shanghai now. */
export function resolveAnimeSeason(query: string, now = new Date()): AnimeSeason | null {
  return parseSeasonHint(query) || (isSeasonBrowse(query) ? currentAnimeSeason(now) : null)
}