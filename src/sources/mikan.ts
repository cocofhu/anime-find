import * as cheerio from 'cheerio'
import { absUrl, decodeEntities, fetchText } from '../http.js'
import type { AnimeSeason } from '../season.js'
import { seasonLabel } from '../season.js'
import type { AnimeCard, FetchOptions, PluginConfig, Subgroup, TorrentItem } from '../types.js'

const BANGUMI_ID = /(\d+)\/?$/

export function mikanListUrl(host: string, query: string, season?: AnimeSeason): string {
  const base = host.replace(/\/$/, '')
  const trimmed = query.trim()
  if (season) {
    return `${base}/Home/BangumiCoverFlowByDayOfWeek?year=${season.year}&seasonStr=${encodeURIComponent(season.season)}`
  }
  if (/^id:\s*\d+$/i.test(trimmed)) {
    return `${base}/Home/Bangumi/${trimmed.replace(/^id:\s*/i, '')}`
  }
  return `${base}/Home/Search?searchstr=${encodeURIComponent(trimmed)}`
}

export async function searchMikan(
  query: string,
  config: PluginConfig,
  signal?: AbortSignal,
  season?: AnimeSeason,
): Promise<AnimeCard[]> {
  const host = config.mikanHost.replace(/\/$/, '')
  const opts: FetchOptions = { timeoutMs: config.timeoutMs, userAgent: config.userAgent }
  const html = await fetchText(mikanListUrl(host, query, season), opts, signal)
  let items = parseMikanSearch(html, host)
  if (season && items.length === 0) {
    const home = await fetchText(`${host}/`, opts, signal)
    items = parseMikanSearch(home, host)
  }
  if (!season) return items
  const label = seasonLabel(season)
  return items.map((it) => ({ ...it, season: it.season || label }))
}

export function parseMikanSearch(html: string, host: string): AnimeCard[] {
  const $ = cheerio.load(html)
  const items: AnimeCard[] = []
  const seen = new Set<string>()
  $('ul.an-ul li').each((_, el) => {
    const a = $(el).find('a').first()
    const href = a.attr('href') || ''
    const cover = $(el).find('[data-src]').attr('data-src') || ''
    const title = decodeEntities(
      a.find('.an-text').attr('title') || a.attr('title') || a.find('.an-text').text() || a.text(),
    ).trim()
    if (!title) return
    const pageUrl = absUrl(host, href)
    const m = href.match(BANGUMI_ID)
    const mikanId = m?.[1] || ''
    const id = mikanId ? `mikan:${mikanId}` : `mikan:${pageUrl}`
    if (seen.has(id)) return
    seen.add(id)
    items.push({
      id,
      title,
      cover: absUrl(host, cover.split('?')[0]),
      pageUrl,
      sources: ['mikan'],
      refs: mikanId ? { mikan: mikanId } : {},
      format: 'tv',
    })
  })
  return items
}

export async function detailMikan(mikanId: string, config: PluginConfig, signal?: AbortSignal): Promise<{ title: string; cover?: string; pageUrl: string; bgmId?: string; groups: Subgroup[] }> {
  const host = config.mikanHost.replace(/\/$/, '')
  const pageUrl = `${host}/Home/Bangumi/${mikanId}`
  const html = await fetchText(pageUrl, { timeoutMs: config.timeoutMs, userAgent: config.userAgent }, signal)
  return parseMikanDetail(html, host, pageUrl)
}

export function parseMikanDetail(html: string, host: string, pageUrl: string): { title: string; cover?: string; pageUrl: string; bgmId?: string; groups: Subgroup[] } {
  const $ = cheerio.load(html)
  const title = decodeEntities($('.bangumi-title').first().clone().children().remove().end().text()).trim()
    || decodeEntities($('.bangumi-title').first().text()).trim()
  const poster = $('.bangumi-poster').attr('style') || ''
  const coverMatch = poster.match(/url\(['"]?([^'")]+)['"]?\)/)
  const cover = coverMatch ? absUrl(host, coverMatch[1].split('?')[0]) : undefined
  const bangumiHref = $('.bangumi-info a[href*="bgm.tv/subject/"]').first().attr('href')
    || $('a[href*="bgm.tv/subject/"]').first().attr('href')
    || ''
  const bgmId = bangumiHref.match(/bgm\.tv\/subject\/(\d+)/)?.[1]
  const groups: Subgroup[] = []

  $('.leftbar-item').each((_, el) => {
    const a = $(el).find('a.subgroup-name').first()
    const label = decodeEntities(a.text()).trim()
    if (!label) return
    const anchor = (a.attr('data-anchor') || '').replace(/^#/, '')
    const updateDay = $(el).find('.date').text().trim()
    const sec = anchor ? $(`[id="${anchor}"]`) : $()
    const rssHref = sec.find('a.mikan-rss').attr('href') || ''
    const table = sec.nextAll('div.episode-table, table').first()
    const items: TorrentItem[] = []
    table.find('tbody > tr').each((__, tr) => {
      const row = $(tr)
      const magnet = decodeEntities(
        row.find('[data-magnet]').attr('data-magnet')
          || row.find('[data-clipboard-text]').attr('data-clipboard-text')
          || '',
      )
      const links = row.find('a')
      const titleText = decodeEntities(links.first().text()).trim()
      if (!titleText && !magnet) return
      let torrent = ''
      links.each((___, link) => {
        const href = $(link).attr('href') || ''
        if (/\.torrent(\?|$)/i.test(href) || /Download/i.test(href) || /Torrent/i.test(href)) {
          torrent = absUrl(host, href)
        }
      })
      const tds = row.find('td')
      items.push({
        title: titleText || magnet,
        size: tds.eq(2).text().trim() || undefined,
        createdAt: tds.eq(3).text().trim() || undefined,
        magnet: magnet || undefined,
        torrent: torrent || undefined,
      })
    })
    groups.push({
      label,
      source: 'mikan',
      updateDay: updateDay || undefined,
      rss: rssHref ? absUrl(host, rssHref) : undefined,
      items,
    })
  })

  return { title: title || `Mikan ${pageUrl}`, cover, pageUrl, bgmId, groups }
}
