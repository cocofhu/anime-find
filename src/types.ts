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
  bgmId?: string
  season?: string
  format?: string
  subgroup?: string
  resourceCount?: number
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
}
