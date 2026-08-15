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
  assert.equal(detail.groups.length, 1)
  assert.equal(detail.groups[0].label, '喵萌奶茶屋')
  assert.equal(detail.groups[0].items.length, 1)
  assert.equal(detail.groups[0].items[0].magnet, 'magnet:?xt=urn:btih:abc123')
  assert.equal(detail.groups[0].items[0].size, '412.3 MB')
  assert.match(detail.groups[0].items[0].torrent || '', /\.torrent$/)
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
