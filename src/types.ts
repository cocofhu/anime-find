export type SourceId = 'mikan' | 'anibt' | 'garden'

export interface SourceError {
  source: SourceId
  message: string
}

export interface AnimeCard {
  id: string
  title: string
  score?: number
  cover?: string
  pageUrl?: string
  nameOrig?: string
  bgmId?: string
  season?: string
  format?: string
  subgroup?: string
  resourceCount?: number
  ratingCount?: number
  tags?: string[]
  sources: SourceId[]
  refs: Partial<Record<SourceId, string>>
}

export interface TorrentItem {
  title: string
  displayTitle?: string
  tags?: string[]
  episode?: string
  size?: string
  createdAt?: string
  magnet?: string
  torrent?: string
}

export interface Subgroup {
  label: string
  source: SourceId
  updateDay?: string
  rss?: string
  items: TorrentItem[]
}

export interface AnimeDetail {
  id: string
  title: string
  cover?: string
  score?: number
  pageUrl?: string
  bgmId?: string
  sources: SourceId[]
  groups: Subgroup[]
}

export interface AnimeDetailMeta {
  bgmId: string
  summary?: string
  nameOrig?: string
  score?: number
  ratingCount?: number
  pageUrl: string
  tags: string[]
  chips: Array<{ label: string; value: string }>
}

export interface BangumiComment {
  nickname: string
  avatarUrl?: string
  rate?: number
  updatedAt?: string
  comment: string
}

export interface BangumiMetaResult {
  bgmId: string
  pageUrl: string
  meta?: AnimeDetailMeta
  comments: BangumiComment[]
  introAvailable: boolean
  commentsAvailable: boolean
}

export interface SearchResult {
  query: string
  items: AnimeCard[]
  errors: SourceError[]
  total?: number
  offset?: number
  hasMore?: boolean
}

export interface FetchOptions {
  timeoutMs: number
  userAgent: string
}

export interface PluginConfig {
  mikanHost: string
  anibtHost: string
  gardenHost: string
  timeoutMs: number
  userAgent: string
  maxResults: number
  sources: SourceId[]
  streamEnabled: boolean
  streamRules: StreamRule[]
}

/**
 * A deliberately small, static-compatible subset of Kazumi rules. The plugin
 * does not execute page JavaScript or WebView interceptors.
 */
export interface StreamRule {
  id: string
  name: string
  enabled: boolean
  baseURL: string
  searchURL: string
  searchList: string
  searchName: string
  searchResult: string
  chapterRoads: string
  chapterResult: string
  chapterName?: string
  /**
   * Either a CSS/XPath selector whose src/href holds the media URL, or
   * `script:<variable>.<field>` to read it out of an inline script object such
   * as the `player_aaaa` payload common to MacCMS sites.
   */
  playURL?: string
  playURLs?: string
  /** Extra hosts the media URL may point at, for sites serving media off a CDN. */
  mediaHosts?: string[]
  headers?: Record<string, string>
  /**
   * Applied on media requests only; an empty value removes the header. A key
   * containing a dot is a host, and its nested map applies to that host and its
   * subdomains only.
   */
  mediaHeaders?: Record<string, string | Record<string, string>>
  useWebview?: boolean
}

export interface StreamEpisode {
  id: string
  name: string
  pageUrl: string
}

export interface StreamSource {
  id: string
  animeTitle: string
  ruleId: string
  ruleName: string
  lineName: string
  sourceUrl: string
  episodes: StreamEpisode[]
  format?: 'hls' | 'mp4' | 'unknown'
  status: 'ready' | 'limited'
}

export interface StreamQuality {
  label: string
  url: string
  format: 'hls' | 'mp4'
}
