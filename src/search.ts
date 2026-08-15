import { mergeCards, parseId } from './normalize.js'
import { parseRelease } from './release.js'
import { parseSeasonHint, resolveAnimeSeason, seasonLabel } from './season.js'
import { detailAniBT, searchAniBT } from './sources/anibt.js'
import { detailGarden, searchGarden } from './sources/garden.js'
import { detailMikan, searchMikan } from './sources/mikan.js'
import type { AnimeCard, AnimeDetail, PluginConfig, SearchResult, SourceError, SourceId, Subgroup } from './types.js'

export { isSeasonBrowse, resolveAnimeSeason } from './season.js'

export async function searchAnime(
  query: string,
  config: PluginConfig & { offset?: number },
  signal?: AbortSignal,
): Promise<SearchResult> {
  const q = query.trim()
  const sources = config.sources.length ? config.sources : (['mikan', 'anibt', 'garden'] as SourceId[])
  const errors: SourceError[] = []
  const lists: AnimeCard[][] = []
  const season = resolveAnimeSeason(q)

  if (season) {
    const jobs: Array<Promise<void>> = []
    if (sources.includes('mikan')) {
      jobs.push(
        searchMikan(q, config, signal, season)
          .then((items) => { lists.push(items) })
          .catch((err) => { errors.push({ source: 'mikan', message: messageOf(err) }) }),
      )
    }
    if (sources.includes('anibt')) {
      const anibtSeason = parseSeasonHint(q) ? seasonLabel(season) : ''
      jobs.push(
        searchAniBT('', config, signal, anibtSeason)
          .then((items) => { lists.push(items) })
          .catch((err) => { errors.push({ source: 'anibt', message: messageOf(err) }) }),
      )
    }
    await Promise.all(jobs)
    return paginate(seasonLabel(season), lists, errors, config)
  }

  const jobs: Array<Promise<void>> = []
  if (sources.includes('mikan')) {
    jobs.push(
      searchMikan(q, config, signal)
        .then((items) => { lists.push(items) })
        .catch((err) => { errors.push({ source: 'mikan', message: messageOf(err) }) }),
    )
  }
  if (sources.includes('anibt')) {
    jobs.push(
      searchAniBT(q, config, signal)
        .then((items) => { lists.push(items) })
        .catch((err) => { errors.push({ source: 'anibt', message: messageOf(err) }) }),
    )
  }
  if (sources.includes('garden')) {
    jobs.push(
      searchGarden(q, config, signal)
        .then((items) => { lists.push(items) })
        .catch((err) => { errors.push({ source: 'garden', message: messageOf(err) }) }),
    )
  }
  await Promise.all(jobs)
  return paginate(q, lists, errors, config)
}

function paginate(
  query: string,
  lists: AnimeCard[][],
  errors: SourceError[],
  config: PluginConfig & { offset?: number },
): SearchResult {
  const all = mergeCards(lists, 1000)
  const offset = Math.max(0, Math.floor(Number(config.offset) || 0))
  const limit = Math.max(1, config.maxResults || 12)
  const items = all.slice(offset, offset + limit)
  return {
    query,
    items,
    errors,
    total: all.length,
    offset,
    hasMore: offset + items.length < all.length,
  }
}

export async function detailAnime(
  id: string,
  config: PluginConfig,
  signal?: AbortSignal,
  hint?: { refs?: AnimeCard['refs']; title?: string },
): Promise<AnimeDetail> {
  const parsed = parseId(id)
  const refs: AnimeCard['refs'] = { ...(hint?.refs || {}) }
  if (parsed.source && parsed.key) refs[parsed.source] ||= parsed.key

  const groups: Subgroup[] = []
  let title = hint?.title || id
  let cover: string | undefined
  let pageUrl: string | undefined
  let bgmId: string | undefined
  const sources: SourceId[] = []
  const jobs: Array<Promise<void>> = []

  if (refs.mikan) {
    jobs.push(
      detailMikan(refs.mikan, config, signal)
        .then((d) => {
          title = d.title || title
          cover ||= d.cover
          pageUrl = d.pageUrl
          bgmId ||= d.bgmId
          sources.push('mikan')
          groups.push(...d.groups)
        })
        .catch(() => { /* keep other sources */ }),
    )
  }
  if (refs.anibt) {
    jobs.push(
      detailAniBT(refs.anibt, config, signal)
        .then((gs) => {
          sources.push('anibt')
          bgmId = refs.anibt
          groups.push(...gs)
        })
        .catch(() => {}),
    )
  }
  if (refs.garden) {
    jobs.push(
      detailGarden(refs.garden, config, signal)
        .then((gs) => {
          sources.push('garden')
          groups.push(...gs)
          if (!hint?.title && gs[0]?.items[0]?.title) title = gs[0].items[0].title
        })
        .catch(() => {}),
    )
  }

  await Promise.all(jobs)

  if (groups.length === 0 && hint?.title && !refs.garden) {
    try {
      const gs = await detailGarden(`title:${hint.title}`, config, signal)
      if (gs.length) {
        sources.push('garden')
        groups.push(...gs)
      }
    } catch { /* ignore */ }
  }

  if (groups.length === 0 && parsed.source !== 'mikan' && /^\d+$/.test(parsed.key)) {
    try {
      const d = await detailMikan(parsed.key, config, signal)
      title = d.title || title
      cover ||= d.cover
      pageUrl ||= d.pageUrl
      bgmId ||= d.bgmId
      sources.push('mikan')
      groups.push(...d.groups)
    } catch { /* ignore */ }
  }

  if (title === id || !title) {
    const hintTitle = groups[0]?.items[0]?.title
    if (hintTitle) title = hintTitle.replace(/^\[[^\]]+]\s*/, '').split(' - ')[0].trim() || title
  }

  return {
    id,
    title,
    cover,
    pageUrl,
    bgmId,
    sources: [...new Set(sources)],
    groups: groups.map((g) => ({
      ...g,
      items: g.items.map((it) => {
        const parsed = parseRelease(it.title, title)
        return { ...it, displayTitle: parsed.heading, tags: parsed.tags, episode: parsed.episode }
      }),
    })),
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
