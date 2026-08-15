export interface ParsedRelease {
  heading: string
  episode?: string
  tags: string[]
  short: string
}

const RESO_MAP: Array<[RegExp, string]> = [
  [/3840\s*[x×]\s*2160|(?:2160)\s*p/i, '2160p'],
  [/1920\s*[x×]\s*1080|(?:1080)\s*p/i, '1080p'],
  [/1280\s*[x×]\s*720|(?:720)\s*p/i, '720p'],
  [/(?:480)\s*p/i, '480p'],
]

export function parseRelease(raw: string, animeTitle?: string): ParsedRelease {
  const title = String(raw || '').replace(/\s+/g, ' ').trim()
  if (!title) return { heading: '', tags: [], short: '' }

  const tags: string[] = []
  const add = (t: string) => {
    if (t && !tags.includes(t)) tags.push(t)
  }

  for (const [re, label] of RESO_MAP) {
    if (re.test(title)) add(label)
  }
  if (/\bWEB-?RIP\b|\bWEB\b/i.test(title)) add('WEB')
  if (/\b(BD|BDMV|BLU-?RAY|BDRip)\b/i.test(title)) add('BD')
  if (/简繁|CHS.?CHT|GB.?BIG5/i.test(title)) {
    add('简中')
    add('繁中')
  } else {
    if (/简体|简中|\bGB\b|\bCHS\b|SC\b/i.test(title)) add('简中')
    if (/繁体|繁中|繁體|\bBIG5\b|\bCHT\b|\bTC\b/i.test(title)) add('繁中')
  }
  if (/粤语|粵語/i.test(title)) add('粤语')
  if (/日语|日語|日文/i.test(title)) add('日语')
  if (/双语|雙語/i.test(title)) add('双语')
  if (/内封|内嵌|外挂/.test(title)) add(/内封/.test(title) ? '内封' : /内嵌/.test(title) ? '内嵌' : '外挂')
  if (/\bEND\b|完结|完$|\bFIN\b/i.test(title)) add('完结')
  if (/合集|全集/.test(title)) add('合集')
  const ver = title.match(/[【\[]\d{1,3}(?:\.\d+)?[vV](\d+)[】\]]/) || title.match(/(?:^|[^\w])[vV](\d+)(?=[\]】\s]|$)/)
  if (ver) add('v' + ver[1])

  const season = pickSeason(title)
  const range = title.match(/[【\[](\d{1,3})\s*[-~～]\s*(\d{1,3})/)
    || title.match(/(\d{1,3})\s*[~～]\s*(\d{1,3})/)
  let episode: string | undefined
  if (range && Number(range[1]) <= 190 && Number(range[2]) <= 190 && Number(range[1]) < Number(range[2])) {
    episode = `${Number(range[1])}-${Number(range[2])}`
  } else {
    episode = pickEpisode(title)
  }

  const short = cleanShort(title, animeTitle)
  let heading = short
  if (episode && episode.includes('-')) {
    heading = `第 ${episode.replace('-', '–')} 集`
  } else if (episode && season) {
    heading = `S${pad(season)}E${pad(episode)}`
  } else if (episode) {
    heading = `第 ${episode} 集`
  }
  return { heading, episode, tags, short }
}

export function groupReleases<T extends { title: string; displayTitle?: string; episode?: string }>(
  items: T[],
  animeTitle?: string,
): Array<{ heading: string; episode?: string; items: T[] }> {
  const order: string[] = []
  const map = new Map<string, { heading: string; episode?: string; items: T[] }>()
  for (const it of items) {
    const parsed = parseRelease(it.title, animeTitle)
    const episode = it.episode || parsed.episode
    const heading = it.displayTitle || parsed.heading
    const key = episode ? `ep:${episode}` : `one:${it.title}`
    let bucket = map.get(key)
    if (!bucket) {
      bucket = { heading, episode, items: [] }
      map.set(key, bucket)
      order.push(key)
    }
    bucket.items.push(it)
  }
  return order.map((k) => map.get(k)!).filter(Boolean)
}

function pad(n: string): string {
  const [a, b] = n.split('.')
  return b ? `${a.padStart(2, '0')}.${b}` : a.padStart(2, '0')
}

function pickSeason(title: string): string | undefined {
  const sxx = title.match(/(?:^|[\s\[【])S(?:eason)?\s*(\d{1,2})(?![a-z])/i)
  if (sxx) return String(Number(sxx[1]))
  const zh = title.match(/第\s*([一二三四五六七八九十\d]{1,3})\s*季/)
  if (!zh) return undefined
  const map: Record<string, string> = { 一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9', 十: '10' }
  return map[zh[1]] || String(Number(zh[1]))
}

function pickEpisode(title: string): string | undefined {
  const se = title.match(/S\d{1,2}\s*E(\d{1,3}(?:\.\d+)?)/i)
  if (se) return stripNum(se[1])
  const zh = title.match(/第\s*(\d{1,3}(?:\.\d+)?)\s*[话話集]/)
  if (zh) return stripNum(zh[1])
  const dash = title.match(/(?:^|[\s/])(?:-\s*|EP?(?:\s*|\.))(\d{1,3}(?:\.\d+)?)(?=\s*(?:END|完|FIN|v\d)?(?:\s|[\]】[]|$))/i)
  if (dash) return stripNum(dash[1])
  const bracket = title.match(/[【\[](\d{1,3}(?:\.\d+)?)(?:\s*[vV]\d)?(?:\s*END)?[】\]]/)
  if (bracket && Number(bracket[1]) <= 190) return stripNum(bracket[1])
  return undefined
}

function stripNum(n: string): string {
  return String(Number(n) || n)
}

function cleanShort(title: string, animeTitle?: string): string {
  if (animeTitle && title.includes(animeTitle)) return animeTitle
  let s = title
  s = s.replace(/\([^)]*(?:WEB|1920|1280|1080|720|2160|AVC|HEVC|AAC|FLAC|SRT|MKV|MP4)[^)]*\)/gi, ' ')
  s = s.replace(/[【\[][^】\]]*(?:1080|720|2160|480|BIG5|GB|MP4|MKV|WEB|HEVC|x26[45]|CHT|CHS|END|合集|内封|外挂|字幕)[^】\]]*[】\]]/gi, ' ')
  s = s.replace(/^[【\[][^】\]]+[】\]]\s*/g, '')
  s = s.replace(/\s*[\\/].*$/, '')
  s = s.replace(/\s{2,}/g, ' ').trim()
  return s.slice(0, 40) || title.slice(0, 40)
}
