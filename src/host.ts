import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'
import { assignConfig, publicConfig, readOverlay, sanitizePatch, sanitizeSources, writeOverlay } from './config-store.js'
import { loadBangumiMeta } from './bangumi.js'
import { fetchBytes } from './http.js'
import { detailAnime, isSeasonBrowse, searchAnime } from './search.js'
import { parseSeasonHint } from './season.js'
import type { PluginConfig, SearchResult, SourceId } from './types.js'

export const name = 'anime-find'
export const inject = ['tools']

export interface Config extends PluginConfig {}

export const Config: Schema<Config> = Schema.object({
  mikanHost: Schema.string().default('https://mikanani.me').description('Mikan 站点'),
  anibtHost: Schema.string().default('https://anibt.net').description('AniBT 站点'),
  gardenHost: Schema.string().default('https://api.animes.garden').description('AnimeGarden API'),
  timeoutMs: Schema.number().default(20000).description('上游请求超时（毫秒）'),
  userAgent: Schema.string().default('Mozilla/5.0 (compatible; anime-find/0.1)').description('请求 UA'),
  maxResults: Schema.number().default(12).description('搜索结果上限'),
  sources: Schema.array(Schema.union(['mikan', 'anibt', 'garden'] as const)).default(['mikan']).description('启用的搜索源，默认仅 Mikan'),
})

export function apply(ctx: Context, config: Config): void {
  const cfg = withDefaults(config)
  assignConfig(cfg, readOverlay())

  ctx.tools.register(defineTool({
    name: 'anime_find_search',
    description:
      'Show clickable anime cards. ALWAYS call this instead of web_search for 动漫/番剧/新番/磁力. For a title, pass that title. For 最近好看的动漫 / 本季 / 还有吗, pass "本季"; the tool uses the host clock (Asia/Shanghai) and lists that season. If the user asks 还有吗 / 再来一些, call AGAIN with the same query and offset = number of cards already shown. Do NOT say there are no more without calling the tool. Do not fetch magnets yourself.',
    parameters: {
      query: { type: 'string', required: true, description: 'Anime title, or "本季" for the current season. Example: 无职转生' },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional subset: mikan, anibt, garden',
      },
      limit: { type: 'number', description: 'Cards in this batch. Season default 36, title default from config.' },
      offset: { type: 'number', description: 'Skip this many already-shown cards when the user wants more.' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => [{ type: 'text', text: renderSearch(value as unknown as SearchResult) }],
      presentationMeta: (_args, value) => ({ kind: 'anime-find-search', ...(value as object) }),
    },
    presentCall: (args) => ({ card: 'generic', title: `搜番 · ${args.query}`, kind: 'search', content: [] }),
    presentResult: (_args, { isError, meta }) => ({
      card: 'generic',
      title: isError ? '搜番失败' : `搜番 · ${(meta as SearchResult | undefined)?.items?.length ?? 0} 条`,
      content: [],
    }),
    timeoutMs: cfg.timeoutMs + 5000,
    async execute(args, exec) {
      const query = String(args.query || '').trim()
      if (query.length < 2 && !isSeasonBrowse(query)) throw new Error('搜索至少需要两个字符')
      const sources = parseSources(args.sources) ?? cfg.sources
      const seasonish = !!(isSeasonBrowse(query) || parseSeasonHint(query))
      const explicit = Number(args.limit)
      const limit = Number.isFinite(explicit) && explicit > 0
        ? clamp(explicit, 1, 80)
        : clamp(seasonish ? Math.max(cfg.maxResults, 36) : cfg.maxResults, 1, 80)
      const offset = Math.max(0, Math.floor(Number(args.offset) || 0))
      return JSON.parse(JSON.stringify(await searchAnime(query || '本季', { ...cfg, sources, maxResults: limit, offset }, exec.signal)))
    },
  }))

  ctx.inject(['systemPrompt'], (c) => {
    const prompt = (c as unknown as {
      systemPrompt: {
        section: (section: { name: string; order: number; text: string | (() => string) }) => void
      }
    }).systemPrompt
    prompt.section({
      name: 'tool:anime-find',
      order: 110,
      text: [
        'Anime / 番剧 / 动漫: call ONLY anime_find_search. Never web_search. Magnets open when the user clicks a card.',
        'For 最近/本季, pass query "本季". The tool uses the host clock; do not guess a year or list old titles from memory.',
        'If the user asks 还有吗 / 再来一些 / 还有别的, call anime_find_search again with query "本季" and offset equal to cards already shown. Never claim there are no more without calling the tool.',
        'After new cards appear, one or two short sentences. Do not print magnet lists.',
      ].join(' '),
    })
  })

  ctx.inject(['webServer'], (c) => {
    const server = (c as unknown as { webServer: { register: (route: { kind: string; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }) => void } }).webServer
    server.register({ kind: 'exact', path: '/anime-find', handler: (req, res) => handleApi(req, res, cfg) })
    server.register({ kind: 'exact', path: '/anime-find/cover', handler: (req, res) => handleCover(req, res, cfg) })
  })
}

function withDefaults(config: Config): PluginConfig {
  return {
    mikanHost: config.mikanHost || 'https://mikanani.me',
    anibtHost: config.anibtHost || 'https://anibt.net',
    gardenHost: config.gardenHost || 'https://api.animes.garden',
    timeoutMs: config.timeoutMs || 20000,
    userAgent: config.userAgent || 'Mozilla/5.0 (compatible; anime-find/0.1)',
    maxResults: config.maxResults || 12,
    sources: (config.sources?.length ? sanitizeSources(config.sources) : ['mikan']) as SourceId[],
  }
}

function parseSources(raw: unknown): SourceId[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const allowed: SourceId[] = ['mikan', 'anibt', 'garden']
  const out = raw.map(String).filter((s): s is SourceId => (allowed as string[]).includes(s))
  return out.length ? out : undefined
}

function isRefs(raw: unknown): raw is Partial<Record<SourceId, string>> {
  return !!raw && typeof raw === 'object' && !Array.isArray(raw)
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function renderSearch(result: SearchResult): string {
  if (!result.items?.length) {
    const err = result.errors?.map((e) => `${e.source}: ${e.message}`).join('; ')
    return err ? `没有结果。来源错误：${err}` : '没有找到相关番剧。'
  }
  const lines = result.items.map((it, i) => {
    const score = it.score != null ? ` ★${it.score.toFixed(1)}` : ''
    return `${i + 1}. ${it.title}${score} [${it.sources.join('+')}]\n   id: ${it.id}`
  })
  const err = result.errors?.length ? `\n部分来源失败：${result.errors.map((e) => e.source).join(', ')}` : ''
  const seasonNote = /[春夏秋冬]$/.test(result.query) ? `（${result.query}）` : ''
  const start = result.offset || 0
  const shown = start + result.items.length
  const followQuery = result.query === '本季' || /[春夏秋冬]$/.test(result.query) ? '本季' : result.query
  const more = result.hasMore
    ? `这是第 ${start + 1}–${shown} 部，一共 ${result.total} 部。用户若问还有吗，立刻再调用 anime_find_search，query 仍为「${followQuery}」，offset=${shown}。`
    : `一共 ${result.total ?? result.items.length} 部，已经全部列出。`
  return `找到 ${result.items.length} 条${seasonNote}，已显示为可点击卡片。${more} 用一两句话概括即可，请用户点击卡片。不要列出磁力链接。\n\n${lines.join('\n')}${err}`
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function sendJson(res: ServerResponse, code: number, body: unknown): void {
  res.statusCode = code
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function handleApi(req: IncomingMessage, res: ServerResponse, cfg: PluginConfig): Promise<void> {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const body = req.method === 'POST' ? await readBody(req) : {}
    const method = String(body.method || url.searchParams.get('method') || 'search')
    if (method === 'search') {
      const query = String(body.query || url.searchParams.get('query') || '').trim()
      if (query.length < 2 && !isSeasonBrowse(query)) return sendJson(res, 400, { ok: false, error: '搜索至少需要两个字符' })
      const sources = parseSources(body.sources) ?? cfg.sources
      const explicit = Number(body.limit)
      const limit = Number.isFinite(explicit) && explicit > 0 ? clamp(explicit, 1, 80) : cfg.maxResults
      const offset = Math.max(0, Math.floor(Number(body.offset) || 0))
      const result = await searchAnime(query, { ...cfg, sources, maxResults: limit, offset })
      return sendJson(res, 200, { ok: true, ...result })
    }
    if (method === 'detail') {
      const id = String(body.id || url.searchParams.get('id') || '').trim()
      if (!id) return sendJson(res, 400, { ok: false, error: '缺少 id' })
      const detail = await detailAnime(id, cfg, undefined, {
        refs: isRefs(body.refs) ? body.refs : undefined,
        title: body.title != null ? String(body.title) : undefined,
      })
      return sendJson(res, 200, { ok: true, ...detail })
    }
    if (method === 'bangumiMeta') {
      const bgmId = String(body.bgmId || url.searchParams.get('bgmId') || '').trim()
      if (!/^\d+$/.test(bgmId)) return sendJson(res, 400, { ok: false, error: '缺少有效的 bgmId' })
      const meta = await loadBangumiMeta(bgmId, cfg)
      return sendJson(res, 200, { ok: true, ...meta })
    }
    if (method === 'config') {
      if (body.save) {
        assignConfig(cfg, sanitizePatch(body))
        writeOverlay(cfg)
      }
      return sendJson(res, 200, { ok: true, ...publicConfig(cfg) })
    }
    sendJson(res, 400, { ok: false, error: 'unknown method' })
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}

async function handleCover(req: IncomingMessage, res: ServerResponse, cfg: PluginConfig): Promise<void> {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const target = url.searchParams.get('url') || ''
    if (!/^https?:\/\//i.test(target)) {
      res.statusCode = 400
      res.end('bad url')
      return
    }
    const { body, contentType } = await fetchBytes(target, { timeoutMs: Math.min(cfg.timeoutMs, 15000), userAgent: cfg.userAgent })
    res.statusCode = 200
    res.setHeader('content-type', contentType.startsWith('image/') ? contentType : 'image/jpeg')
    res.setHeader('cache-control', 'public, max-age=3600')
    res.end(body)
  } catch (err) {
    res.statusCode = 502
    res.end(err instanceof Error ? err.message : 'cover failed')
  }
}
