import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parseMikanDetail, parseMikanSearch, mikanListUrl } from '../sources/mikan.js'
import { seriesTitle } from '../sources/garden.js'
import { mergeCards, normalizeTitle } from '../normalize.js'
import { parseRelease, groupReleases } from '../release.js'
import { isSeasonBrowse } from '../search.js'
import { currentAnimeSeason, parseSeasonHint, resolveAnimeSeason } from '../season.js'
import { DEFAULT_SOURCES, sanitizeSources } from '../config-store.js'
import { cardFieldsFromSubject, enrichCardsWithBangumi, loadBangumiMeta, mapComments, mapSubject } from '../bangumi.js'
import type { AnimeCard, PluginConfig } from '../types.js'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFileSync(join(dir, 'fixtures', name), 'utf8')

test('parseMikanSearch extracts cards', () => {
  const items = parseMikanSearch(fixture('mikan-search.html'), 'https://mikanani.me')
  assert.equal(items.length, 2)
  assert.equal(items[0].id, 'mikan:3060')
  assert.match(items[0].title, /无职转生/)
  assert.equal(items[0].pageUrl, 'https://mikanani.me/Home/Bangumi/3060')
  assert.equal(items[0].cover, 'https://mikanani.me/images/Bangumi/s2.jpg')
  assert.equal(items[1].id, 'mikan:1234')
})

test('parseMikanDetail extracts magnet and torrent', () => {
  const detail = parseMikanDetail(fixture('mikan-detail.html'), 'https://mikanani.me', 'https://mikanani.me/Home/Bangumi/3060')
  assert.match(detail.title, /无职转生/)
  assert.equal(detail.cover, 'https://mikanani.me/images/Bangumi/cover.jpg')
  assert.equal(detail.bgmId, '478425')
  assert.equal(detail.groups.length, 1)
  assert.equal(detail.groups[0].label, '喵萌奶茶屋')
  assert.equal(detail.groups[0].items.length, 1)
  assert.equal(detail.groups[0].items[0].magnet, 'magnet:?xt=urn:btih:abc123')
  assert.equal(detail.groups[0].items[0].size, '412.3 MB')
  assert.match(detail.groups[0].items[0].torrent || '', /\.torrent$/)
})

test('parseMikanDetail keeps resource parsing when no Bangumi link exists', () => {
  const html = fixture('mikan-detail.html').replace(/<div class="bangumi-info">[\s\S]*?<\/div>/, '')
  const detail = parseMikanDetail(html, 'https://mikanani.me', 'https://mikanani.me/Home/Bangumi/3060')
  assert.equal(detail.bgmId, undefined)
  assert.equal(detail.groups.length, 1)
})

test('mapSubject maps Bangumi metadata and optional chips', () => {
  const subject = JSON.parse(fixture('bangumi-subject.json'))
  const persons = JSON.parse(fixture('bangumi-persons.json'))
  const meta = mapSubject('481410', subject, persons)
  assert.equal(meta.nameOrig, 'MAO')
  assert.equal(meta.score, 7.8)
  assert.equal(meta.ratingCount, 1284)
  assert.deepEqual(meta.tags, ['原创', '奇幻', '战斗'])
  assert.deepEqual(meta.chips, [
    { label: '放送', value: '2026-07-05' },
    { label: '话数', value: '24' },
    { label: '类型', value: 'TV' },
    { label: '原作', value: '高橋留美子' },
    { label: '动画制作', value: 'OLM' },
  ])
})

test('cardFieldsFromSubject maps search-card Bangumi fields without replacing the title', () => {
  const subject = JSON.parse(fixture('bangumi-subject.json'))
  const fields = cardFieldsFromSubject('481410', subject)
  assert.equal(fields.bgmId, '481410')
  assert.equal(fields.title, undefined)
  assert.equal(fields.nameOrig, 'MAO')
  assert.equal(fields.score, 7.8)
  assert.equal(fields.ratingCount, 1284)
  assert.deepEqual(fields.tags, ['原创', '奇幻', '战斗'])
})

test('enrichCardsWithBangumi fills score, tags and Bangumi id from search', async () => {
  const originalFetch = globalThis.fetch
  const config: PluginConfig = {
    mikanHost: 'https://mikanani.me',
    anibtHost: 'https://anibt.net',
    gardenHost: 'https://api.animes.garden',
    timeoutMs: 1000,
    userAgent: 'anime-find test',
    maxResults: 12,
    sources: ['mikan'],
    streamEnabled: false,
    streamRules: [],
  }
  const cards: AnimeCard[] = [{ id: 'mikan:1', title: '摩绪', sources: ['mikan'], refs: { mikan: '1' } }]
  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input)
      if (url.includes('/search/subjects')) {
        assert.equal(init?.method, 'POST')
        return new Response(JSON.stringify({
          data: [{
            id: 481410,
            name: 'MAO',
            name_cn: '摩绪',
            rating: { score: 7.8, total: 1284 },
            tags: [{ name: '原创' }, { name: '奇幻' }, { name: '战斗' }, { name: '少年' }],
          }],
        }))
      }
      return new Response('unexpected ' + url, { status: 404 })
    }
    await enrichCardsWithBangumi(cards, config)
    assert.equal(cards[0].title, '摩绪')
    assert.equal(cards[0].bgmId, '481410')
    assert.equal(cards[0].nameOrig, 'MAO')
    assert.equal(cards[0].score, 7.8)
    assert.equal(cards[0].ratingCount, 1284)
    assert.deepEqual(cards[0].tags, ['原创', '奇幻', '战斗'])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('enrichCardsWithBangumi loads a subject by existing bgmId', async () => {
  const originalFetch = globalThis.fetch
  const config: PluginConfig = {
    mikanHost: 'https://mikanani.me',
    anibtHost: 'https://anibt.net',
    gardenHost: 'https://api.animes.garden',
    timeoutMs: 1000,
    userAgent: 'anime-find test',
    maxResults: 12,
    sources: ['mikan'],
    streamEnabled: false,
    streamRules: [],
  }
  const cards: AnimeCard[] = [{ id: 'mikan:1', title: '摩绪', bgmId: '481410', sources: ['mikan'], refs: { mikan: '1' } }]
  try {
    globalThis.fetch = async (input) => {
      const url = String(input)
      if (url.includes('/search/subjects')) return new Response('should use id', { status: 500 })
      if (url.endsWith('/subjects/481410')) return new Response(fixture('bangumi-subject.json'))
      return new Response('unexpected ' + url, { status: 404 })
    }
    await enrichCardsWithBangumi(cards, config)
    assert.equal(cards[0].score, 7.8)
    assert.equal(cards[0].nameOrig, 'MAO')
    assert.deepEqual(cards[0].tags, ['原创', '奇幻', '战斗'])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('enrichCardsWithBangumi keeps the original card when Bangumi fails', async () => {
  const originalFetch = globalThis.fetch
  const config: PluginConfig = {
    mikanHost: 'https://mikanani.me',
    anibtHost: 'https://anibt.net',
    gardenHost: 'https://api.animes.garden',
    timeoutMs: 1000,
    userAgent: 'anime-find test',
    maxResults: 12,
    sources: ['mikan'],
    streamEnabled: false,
    streamRules: [],
  }
  const cards: AnimeCard[] = [{ id: 'mikan:1', title: '摩绪', sources: ['mikan'], refs: { mikan: '1' } }]
  try {
    globalThis.fetch = async () => new Response('unavailable', { status: 503 })
    await enrichCardsWithBangumi(cards, config)
    assert.equal(cards[0].bgmId, undefined)
    assert.equal(cards[0].score, undefined)
    assert.equal(cards[0].title, '摩绪')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('mapComments limits and normalizes Bangumi comments', () => {
  const comments = mapComments(JSON.parse(fixture('bangumi-comments.json')))
  assert.deepEqual(comments, [{
    comment: '值得一看',
    rate: 8,
    updatedAt: '2025-10-09',
    nickname: '栗子',
    avatarUrl: 'https://example.com/a-large.jpg',
  }])
})

test('loadBangumiMeta isolates introduction and comment failures', async () => {
  const originalFetch = globalThis.fetch
  const config: PluginConfig = {
    mikanHost: 'https://mikanani.me',
    anibtHost: 'https://anibt.net',
    gardenHost: 'https://api.animes.garden',
    timeoutMs: 1000,
    userAgent: 'anime-find test',
    maxResults: 12,
    sources: ['mikan'],
    streamEnabled: false,
    streamRules: [],
  }
  try {
    globalThis.fetch = async (input) => {
      const url = String(input)
      if (url.includes('/comments')) return new Response(JSON.stringify({ data: [{ comment: '短评仍可用', user: { nickname: '测试' } }] }))
      return new Response('upstream unavailable', { status: 503 })
    }
    const commentsOnly = await loadBangumiMeta('481410', config)
    assert.equal(commentsOnly.introAvailable, false)
    assert.equal(commentsOnly.commentsAvailable, true)
    assert.equal(commentsOnly.comments.length, 1)

    globalThis.fetch = async (input) => {
      const url = String(input)
      if (url.includes('/comments')) return new Response('unavailable', { status: 503 })
      if (url.endsWith('/persons')) return new Response(JSON.stringify([]))
      return new Response(JSON.stringify({ name: '原文名', name_cn: '中文名', summary: '', infobox: [] }))
    }
    const introOnly = await loadBangumiMeta('481410', config)
    assert.equal(introOnly.introAvailable, true)
    assert.equal(introOnly.commentsAvailable, false)
    assert.equal(introOnly.comments.length, 0)

    globalThis.fetch = async () => new Response('unavailable', { status: 503 })
    const neither = await loadBangumiMeta('481410', config)
    assert.equal(neither.introAvailable, false)
    assert.equal(neither.commentsAvailable, false)
    assert.equal(neither.comments.length, 0)

    const invalid = await loadBangumiMeta('invalid', config)
    assert.equal(invalid.pageUrl, '')
    assert.equal(invalid.introAvailable, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('mergeCards dedupes by bgmId and title', () => {
  const merged = mergeCards([
    [{ id: 'mikan:1', title: '无职转生 第二季', sources: ['mikan'], refs: { mikan: '1' }, bgmId: '9' }],
    [{ id: 'anibt:9', title: '无职转生', sources: ['anibt'], refs: { anibt: '9' }, bgmId: '9', score: 8.3 }],
  ], 10)
  assert.equal(merged.length, 1)
  assert.deepEqual(merged[0].sources.sort(), ['anibt', 'mikan'])
  assert.equal(merged[0].score, 8.3)
})

test('mergeCards does not invent 0 resourceCount', () => {
  const merged = mergeCards([
    [{ id: 'mikan:3739', title: '一拳超人', sources: ['mikan'], refs: { mikan: '3739' } }],
    [{ id: 'mikan:1934', title: '一拳超人 第二季', sources: ['mikan'], refs: { mikan: '1934' } }],
    [{ id: 'anibt:127563', title: '一拳超人', sources: ['anibt'], refs: { anibt: '127563' }, bgmId: '127563', resourceCount: 0 }],
  ], 10)
  for (const card of merged) {
    assert.equal(card.resourceCount, undefined)
  }
})

test('mergeCards overlays garden resource counts onto same-title cards', () => {
  const merged = mergeCards([
    [{ id: 'anibt:127563', title: '一拳超人', sources: ['anibt'], refs: { anibt: '127563' }, bgmId: '127563' }],
    [{ id: 'garden:title:一拳超人', title: '一拳超人', sources: ['garden'], refs: { garden: 'title:一拳超人' }, resourceCount: 80 }],
  ], 10)
  const main = merged.find((c) => c.title === '一拳超人')
  assert.ok(main)
  assert.equal(main?.resourceCount, 80)
  assert.ok(main?.sources.includes('anibt'))
  assert.ok(main?.sources.includes('garden'))
})

test('mergeCards overlays Bangumi tags and rating counts', () => {
  const merged = mergeCards([
    [{ id: 'mikan:1', title: '摩绪', sources: ['mikan'], refs: { mikan: '1' } }],
    [{ id: 'anibt:9', title: '摩绪', sources: ['anibt'], refs: { anibt: '9' }, bgmId: '481410', ratingCount: 1284, tags: ['原创', '奇幻', '战斗'] }],
  ], 10)
  assert.equal(merged.length, 1)
  assert.equal(merged[0].bgmId, '481410')
  assert.equal(merged[0].ratingCount, 1284)
  assert.deepEqual(merged[0].tags, ['原创', '奇幻', '战斗'])
})

test('sanitizeSources defaults to mikan only', () => {
  assert.deepEqual(DEFAULT_SOURCES, ['mikan'])
  assert.deepEqual(sanitizeSources(undefined), ['mikan'])
  assert.deepEqual(sanitizeSources([]), ['mikan'])
  assert.deepEqual(sanitizeSources(['garden', 'mikan', 'nope']), ['garden', 'mikan'])
})

test('isSeasonBrowse treats recommendation prompts as current season', () => {
  assert.equal(isSeasonBrowse('最近有哪些好看的动漫'), true)
  assert.equal(isSeasonBrowse('本季新番'), true)
  assert.equal(isSeasonBrowse('推荐番剧'), true)
  assert.equal(isSeasonBrowse('无职转生'), false)
  assert.equal(isSeasonBrowse('最近的葬送的芙莉莲'), false)
})

test('follow-up asks like 还有吗 stay on the season list', () => {
  assert.equal(isSeasonBrowse('还有吗'), true)
  assert.equal(isSeasonBrowse('再来一些'), true)
  assert.equal(isSeasonBrowse('还有其他好看的动漫吗'), true)
})

test('mergeCards paginates so a second call returns new cards', () => {
  const lists = [Array.from({ length: 30 }, (_, i) => ({
    id: `mikan:${i}`,
    title: `番 ${i}`,
    sources: ['mikan' as const],
    refs: { mikan: String(i) },
  }))]
  const first = mergeCards(lists, 12)
  const second = mergeCards(lists, 12, 12)
  assert.equal(first.length, 12)
  assert.equal(second.length, 12)
  assert.equal(first.some((c) => second.some((o) => o.id === c.id)), false)
})

test('currentAnimeSeason uses Asia/Shanghai clock', () => {
  assert.deepEqual(currentAnimeSeason(new Date('2026-08-16T04:00:00Z')), { year: 2026, season: '夏' })
  assert.deepEqual(currentAnimeSeason(new Date('2026-01-15T04:00:00Z')), { year: 2026, season: '冬' })
  assert.deepEqual(currentAnimeSeason(new Date('2026-12-01T00:00:00+08:00')), { year: 2026, season: '冬' })
  assert.deepEqual(currentAnimeSeason(new Date('2026-04-01T00:00:00+08:00')), { year: 2026, season: '春' })
  assert.deepEqual(currentAnimeSeason(new Date('2026-10-01T00:00:00+08:00')), { year: 2026, season: '秋' })
})

test('resolveAnimeSeason prefers host clock for 最近/本季', () => {
  const now = new Date('2026-08-16T04:00:00Z')
  assert.deepEqual(resolveAnimeSeason('最近有哪些好看的动漫', now), { year: 2026, season: '夏' })
  assert.deepEqual(resolveAnimeSeason('本季', now), { year: 2026, season: '夏' })
  assert.deepEqual(parseSeasonHint('2025春'), { year: 2025, season: '春' })
  assert.deepEqual(parseSeasonHint('2025年7月'), { year: 2025, season: '夏' })
  assert.equal(resolveAnimeSeason('无职转生', now), null)
})

test('mikanListUrl uses cover-flow for a season, not keyword search', () => {
  const url = mikanListUrl('https://mikanani.me', '本季', { year: 2026, season: '夏' })
  assert.equal(url, 'https://mikanani.me/Home/BangumiCoverFlowByDayOfWeek?year=2026&seasonStr=%E5%A4%8F')
  assert.equal(
    mikanListUrl('https://mikanani.me', '无职转生'),
    'https://mikanani.me/Home/Search?searchstr=%E6%97%A0%E8%81%8C%E8%BD%AC%E7%94%9F',
  )
})

test('parseMikanSearch extracts weekly season cover-flow cards', () => {
  const items = parseMikanSearch(fixture('mikan-season.html'), 'https://mikanani.me')
  assert.equal(items.length, 11)
  assert.equal(items[0].id, 'mikan:501')
  assert.equal(items[0].title, '周五番')
})

test('normalizeTitle strips season noise', () => {
  assert.equal(normalizeTitle('无职转生 第二季 ～到了异世界～'), normalizeTitle('无职转生'))
})

test('seriesTitle extracts show name from garden torrent titles', () => {
  assert.equal(
    seriesTitle('【幻櫻字幕組】【一拳超人 ONE PUNCH MAN】【25~36+S3 00】【BIG5_MP4】', '一拳超人'),
    '一拳超人',
  )
  assert.equal(
    seriesTitle('[ANi] 一拳超人 [1080p]', '一拳超人'),
    '一拳超人',
  )
  assert.equal(seriesTitle('[10月新番][一拳超人][12][WebRip 1080p]', '一拳超人'), '一拳超人')
})

test('parseRelease shortens torrent release titles', () => {
  const a = parseRelease(
    '[jibaketa合成][代理商粤语]一拳超人 第3季 / One Punch Man S3 - 12 END [粤日双语+内封繁体中文字幕](WEB 1920x1080 AVC AACx2 SRT MUSE CHT)',
    '一拳超人',
  )
  assert.equal(a.heading, 'S03E12')
  assert.ok(a.tags.includes('1080p'))
  assert.ok(a.tags.includes('粤语'))
  assert.ok(a.tags.includes('繁中'))
  const b = parseRelease('【幻櫻字幕組】【一拳超人】【25~36+S3 00】【BIG5_MP4】【1920X1080】【合集】')
  assert.match(b.heading, /25/)
  assert.ok(b.tags.includes('1080p'))
  assert.ok(b.tags.includes('合集'))
})

test('groupReleases collapses duplicate episode headings', () => {
  const grouped = groupReleases([
    { title: '[北宇治字幕组] 再见，菈菈 [06v2][WebRip][HEVC_AAC][简日内嵌]' },
    { title: '[北宇治字幕组] 再见，菈菈 [06][WebRip][HEVC_AAC][简日内嵌]' },
    { title: '[北宇治字幕组] 再见，菈菈 [05][WebRip]' },
  ])
  assert.equal(grouped.length, 2)
  assert.equal(grouped[0].heading, '第 6 集')
  assert.equal(grouped[0].items.length, 2)
  assert.equal(grouped[1].heading, '第 5 集')
  const v2 = parseRelease('[北宇治字幕组] 再见，菈菈 [06v2][WebRip][简日内嵌]')
  assert.equal(v2.episode, '6')
  assert.ok(v2.tags.includes('v2'))
  assert.ok(v2.tags.includes('内嵌'))
})
