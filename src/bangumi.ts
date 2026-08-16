import { fetchJson } from './http.js'
import type { AnimeCard, AnimeDetailMeta, BangumiComment, BangumiMetaResult, FetchOptions, PluginConfig } from './types.js'

type Subject = {
  name?: string
  name_cn?: string
  summary?: string
  date?: string
  eps?: number
  total_episodes?: number
  platform?: string
  rating?: { score?: number; total?: number }
  tags?: Array<{ name?: string; count?: number }>
  infobox?: Array<{ key?: string; value?: string }>
}

type Person = {
  relation?: string
  name?: string
  name_cn?: string
}

type Avatar = {
  small?: string
  medium?: string
  large?: string
}

type CommentResponse = {
  data?: Array<{
    comment?: string
    rate?: number
    updatedAt?: number | string
    user?: { nickname?: string; avatar?: Avatar }
  }>
}

type SearchHit = Subject & { id?: number }

type SearchResponse = {
  data?: SearchHit[]
}

const BGM_API = 'https://api.bgm.tv/v0'
const BGM_NEXT = 'https://next.bgm.tv/p1'

export async function loadBangumiMeta(
  bgmId: string,
  config: PluginConfig,
  signal?: AbortSignal,
): Promise<BangumiMetaResult> {
  const id = String(bgmId).trim()
  if (!/^\d+$/.test(id)) {
    return { bgmId: id, pageUrl: '', comments: [], introAvailable: false, commentsAvailable: false }
  }

  const options = { timeoutMs: config.timeoutMs, userAgent: config.userAgent }
  const [intro, comments] = await Promise.allSettled([
    Promise.all([
      fetchJson<Subject>(`${BGM_API}/subjects/${id}`, options, signal),
      fetchJson<Person[]>(`${BGM_API}/subjects/${id}/persons`, options, signal).catch(() => []),
    ]),
    fetchJson<CommentResponse>(`${BGM_NEXT}/subjects/${id}/comments?limit=5`, options, signal),
  ])

  const meta = intro.status === 'fulfilled' ? mapSubject(id, intro.value[0], intro.value[1]) : undefined
  const mappedComments = comments.status === 'fulfilled' ? mapComments(comments.value) : []
  return {
    bgmId: id,
    pageUrl: `https://bgm.tv/subject/${id}`,
    meta,
    comments: mappedComments,
    introAvailable: !!meta,
    commentsAvailable: mappedComments.length > 0,
  }
}

export function mapSubject(bgmId: string, subject: Subject, persons: Person[] = []): AnimeDetailMeta {
  const chips: AnimeDetailMeta['chips'] = []
  addChip(chips, '放送', subject.date || infoboxValue(subject, ['放送开始', '放送日期']))
  addChip(chips, '话数', numberText(subject.eps ?? subject.total_episodes) || infoboxValue(subject, ['话数']))
  addChip(chips, '类型', subject.platform)
  addChip(chips, '原作', personName(persons, '原作'))
  addChip(chips, '动画制作', personName(persons, '动画制作'))
  return {
    bgmId,
    summary: cleanText(subject.summary),
    nameOrig: differentName(subject.name, subject.name_cn),
    score: finiteNumber(subject.rating?.score),
    ratingCount: finiteNumber(subject.rating?.total),
    pageUrl: `https://bgm.tv/subject/${bgmId}`,
    tags: subjectTags(subject),
    chips,
  }
}

export function cardFieldsFromSubject(bgmId: string, subject: Subject): Partial<AnimeCard> {
  const nameCn = cleanText(subject.name_cn)
  const name = cleanText(subject.name)
  return {
    bgmId,
    ...(name || nameCn ? { nameOrig: name || nameCn } : {}),
    score: finiteNumber(subject.rating?.score),
    ratingCount: finiteNumber(subject.rating?.total),
    tags: subjectTags(subject),
  }
}

export async function enrichCardsWithBangumi(
  cards: AnimeCard[],
  config: PluginConfig,
  signal?: AbortSignal,
): Promise<void> {
  if (!cards.length) return
  const options = { timeoutMs: Math.min(config.timeoutMs, 4000), userAgent: config.userAgent }
  await mapLimit(cards, 4, async (card) => {
    if (signal?.aborted) return
    if (card.bgmId && card.score != null && card.tags?.length) return
    try {
      const resolved = await resolveSubject(card, options, signal)
      if (!resolved) return
      applyCardFields(card, cardFieldsFromSubject(resolved.bgmId, resolved.subject))
    } catch { /* keep the original card when Bangumi is unavailable */ }
  })
}

async function resolveSubject(
  card: AnimeCard,
  options: FetchOptions,
  signal?: AbortSignal,
): Promise<{ bgmId: string; subject: Subject } | undefined> {
  if (card.bgmId) {
    const subject = await fetchJson<Subject>(`${BGM_API}/subjects/${card.bgmId}`, options, signal)
    return { bgmId: card.bgmId, subject }
  }
  const hit = await searchSubject(card.title, options, signal)
  if (!hit?.id) return undefined
  const bgmId = String(hit.id)
  if (hit.name || hit.name_cn || hit.rating || hit.tags?.length) return { bgmId, subject: hit }
  const subject = await fetchJson<Subject>(`${BGM_API}/subjects/${bgmId}`, options, signal)
  return { bgmId, subject }
}

async function searchSubject(title: string, options: FetchOptions, signal?: AbortSignal): Promise<SearchHit | undefined> {
  const keyword = title.trim()
  if (keyword.length < 2) return undefined
  const found = await fetchJson<SearchResponse>(`${BGM_API}/search/subjects?limit=1`, options, signal, {
    method: 'POST',
    body: JSON.stringify({ keyword, sort: 'match', filter: { type: [2] } }),
  })
  const hit = found.data?.[0]
  return typeof hit?.id === 'number' && Number.isFinite(hit.id) ? hit : undefined
}

function applyCardFields(card: AnimeCard, fields: Partial<AnimeCard>): void {
  if (fields.bgmId) card.bgmId = fields.bgmId
  if (fields.title) card.title = fields.title
  if (fields.nameOrig) card.nameOrig = fields.nameOrig
  if (fields.score != null) card.score = fields.score
  if (fields.ratingCount != null) card.ratingCount = fields.ratingCount
  if (fields.tags?.length) card.tags = fields.tags
}

function subjectTags(subject: Subject): string[] {
  return (subject.tags || []).map((tag) => cleanText(tag.name)).filter((name): name is string => !!name).slice(0, 3)
}

async function mapLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let index = 0
  const run = async () => {
    while (index < items.length) {
      const current = items[index]
      index += 1
      await worker(current)
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () => run()))
}

export function mapComments(response: CommentResponse): BangumiComment[] {
  return (response.data || []).slice(0, 5).flatMap((item) => {
    const comment = cleanText(item.comment)
    if (!comment) return []
    return [{
      nickname: cleanText(item.user?.nickname) || 'Bangumi 用户',
      avatarUrl: avatarUrl(item.user?.avatar),
      rate: finiteNumber(item.rate),
      updatedAt: formatDate(item.updatedAt),
      comment,
    }]
  })
}

function addChip(chips: AnimeDetailMeta['chips'], label: string, value?: string): void {
  if (value) chips.push({ label, value })
}

function infoboxValue(subject: Subject, keys: string[]): string | undefined {
  const entry = subject.infobox?.find((item) => keys.includes(cleanText(item.key) || ''))
  return cleanText(entry?.value)
}

function personName(persons: Person[], relation: string): string | undefined {
  return persons
    .filter((item) => cleanText(item.relation) === relation)
    .map((item) => cleanText(item.name_cn) || cleanText(item.name))
    .filter(Boolean)
    .join('、') || undefined
}

function avatarUrl(avatar?: Avatar): string | undefined {
  return cleanText(avatar?.large) || cleanText(avatar?.medium) || cleanText(avatar?.small)
}

function differentName(name?: string, nameCn?: string): string | undefined {
  const original = cleanText(name)
  return original && original !== cleanText(nameCn) ? original : undefined
}

function numberText(value: number | undefined): string | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? String(value) : undefined
}

function finiteNumber(value: unknown): number | undefined {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : undefined
}

function cleanText(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || undefined
}

function formatDate(value: number | string | undefined): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value * 1000).toISOString().slice(0, 10)
  return cleanText(value)
}
