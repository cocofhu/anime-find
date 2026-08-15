import { fetchJson } from './http.js'
import type { AnimeDetailMeta, BangumiComment, BangumiMetaResult, PluginConfig } from './types.js'

type Subject = {
  name?: string
  name_cn?: string
  summary?: string
  date?: string
  eps?: number
  total_episodes?: number
  platform?: string
  rating?: { score?: number; total?: number }
  infobox?: Array<{ key?: string; value?: string }>
}

type Person = {
  relation?: string
  person?: { name?: string; name_cn?: string }
}

type CommentResponse = {
  data?: Array<{
    comment?: string
    rate?: number
    updatedAt?: number | string
    user?: { nickname?: string; avatar?: string }
  }>
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
    chips,
  }
}

export function mapComments(response: CommentResponse): BangumiComment[] {
  return (response.data || []).slice(0, 5).flatMap((item) => {
    const comment = cleanText(item.comment)
    if (!comment) return []
    return [{
      nickname: cleanText(item.user?.nickname) || 'Bangumi 用户',
      avatarUrl: cleanText(item.user?.avatar),
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
    .map((item) => cleanText(item.person?.name_cn) || cleanText(item.person?.name))
    .filter(Boolean)
    .join('、') || undefined
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
