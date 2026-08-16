import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sanitizeStreamRules } from '../config-store.js'
import { handleHlsAsset, handleMedia } from '../host.js'
import { aggregateStreams, fetchAllowedStream, isAllowedForRule, isAllowedStreamUrl, resolveStream, runWithConcurrency, validateRule } from '../streaming.js'
import type { PluginConfig, StreamRule, StreamSource } from '../types.js'

const clientSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../src/client.js'), 'utf8')

const rule: StreamRule = {
  id: 'demo',
  name: 'Demo',
  enabled: true,
  baseURL: 'https://media.example.test',
  searchURL: '/search?q={{keyword}}',
  searchList: '.result',
  searchName: '.name',
  searchResult: 'a',
  chapterRoads: '.episode',
  chapterResult: 'a',
}

const config: PluginConfig = {
  mikanHost: 'https://mikanani.me',
  anibtHost: 'https://anibt.net',
  gardenHost: 'https://api.animes.garden',
  timeoutMs: 20000,
  userAgent: 'test',
  maxResults: 12,
  sources: ['mikan'],
  streamEnabled: true,
  streamRules: [rule],
}

test('validateRule accepts the static XPath subset used by KazumiRules', () => {
  const validated = validateRule({
    ...rule,
    searchList: '//div[2]/div',
    searchName: '//div[2]/text()',
    searchResult: '//a',
    chapterRoads: '//div[contains(@class, "episode")]//div',
    chapterResult: '//a',
  })
  assert.equal(validated.rule.searchList, '//div[2]/div')
  assert.throws(() => validateRule({ ...rule, searchList: '//div[position()=1]' }), /不支持/)
})

test('client settings copy advertises the static CSS or limited XPath subset', () => {
  assert.match(clientSource, /首期支持静态 CSS 或受限 XPath 子集，不支持 WebView 拦截/)
  assert.match(clientSource, /粘贴兼容的静态 CSS 或受限 XPath 子集规则/)
  assert.doesNotMatch(clientSource, /首期仅支持静态 CSS 解析规则/)
})

test('streaming ToolView provides stable browser E2E selectors and card state labels', () => {
  assert.match(clientSource, /data-testid": "resource-tab"/)
  assert.match(clientSource, /data-testid": "stream-tab"/)
  assert.match(clientSource, /data-testid": "stream-source-card"/)
  assert.match(clientSource, /data-testid": "stream-episode"/)
  assert.match(clientSource, /data-testid": "stream-previous-episode"/)
  assert.match(clientSource, /data-testid": "stream-next-episode"/)
  assert.match(clientSource, /"可播放"/)
  assert.match(clientSource, /"部分集受限"/)
  assert.match(clientSource, /"选集播放 ›"/)
  assert.match(clientSource, /未知格式/)
  assert.match(clientSource, /打开插件设置/)
  assert.match(clientSource, /toggleRule/)
  assert.match(clientSource, /ruleWarnings/)
})

test('streaming player navigation follows the rendered episode order with disabled boundaries', () => {
  assert.match(clientSource, /const episodeIndex = episode \? ordered\.findIndex/)
  assert.match(clientSource, /const previousEpisode = episodeIndex > 0/)
  assert.match(clientSource, /const nextEpisode = episodeIndex >= 0 && episodeIndex < ordered\.length - 1/)
  assert.match(clientSource, /disabled: !previousEpisode/)
  assert.match(clientSource, /disabled: !nextEpisode/)
  assert.match(clientSource, /"上一集"/)
  assert.match(clientSource, /"下一集"/)
})

test('client selects hls.js from resolved quality format, including signed HLS URLs', () => {
  assert.match(clientSource, /const isHls = currentQuality\?\.format === "hls"/)
  assert.match(clientSource, /if \(!video \|\| !currentUrl \|\| !isHls\) return/)
  assert.match(clientSource, /src: isHls \? undefined : pluginUrl\(currentUrl\)/)
  assert.doesNotMatch(clientSource, /\.m3u8\(\?:\\\?\|\$\)\/i\.test\(currentUrl\)/)
})

test('media allowlist only accepts enabled rule domains', () => {
  assert.equal(isAllowedStreamUrl('https://cdn.media.example.test/a.m3u8', config)?.id, 'demo')
  assert.equal(isAllowedStreamUrl('https://untrusted.example/a.m3u8', config), undefined)
  assert.equal(isAllowedStreamUrl('file:///etc/passwd', config), undefined)
  assert.equal(isAllowedForRule('http://127.0.0.1/private', rule), false)
  assert.equal(isAllowedForRule('http://169.254.169.254/latest/meta-data', { ...rule, baseURL: 'http://169.254.169.254' }), false)
  assert.equal(isAllowedForRule('http://[::ffff:127.0.0.1]/private', { ...rule, baseURL: 'http://[::ffff:127.0.0.1]' }), false)
  assert.equal(isAllowedForRule('http://[::ffff:169.254.169.254]/latest/meta-data', { ...rule, baseURL: 'http://[::ffff:169.254.169.254]' }), false)
})

test('rule persistence rejects private IPv4-mapped IPv6 origins', () => {
  assert.deepEqual(sanitizeStreamRules([{ ...rule, baseURL: 'http://[::ffff:127.0.0.1]' }]), [])
  assert.deepEqual(sanitizeStreamRules([{ ...rule, baseURL: 'http://[::ffff:169.254.169.254]' }]), [])
})

test('rule fetch refuses a redirect from an allowed domain to a private address', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('', {
      status: 302,
      headers: { location: 'http://127.0.0.1/private' },
    })
    await assert.rejects(
      fetchAllowedStream('https://media.example.test/redirect', rule, config),
      /不在当前规则允许域内/,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('stream aggregation limits concurrent source-site requests', async () => {
  let active = 0
  let peak = 0
  const tasks = Array.from({ length: 10 }, (_, index) => async () => {
    active++; peak = Math.max(peak, active)
    await new Promise((resolve) => setTimeout(resolve, 5))
    active--
    return index
  })
  const results = await runWithConcurrency(tasks, 3)
  assert.equal(peak, 3)
  assert.deepEqual(results.map((item) => item.status === 'fulfilled' ? item.value : -1), [...Array(10).keys()])
})

test('fixture flow parses search results and episodes before resolving a media URL', async () => {
  const originalFetch = globalThis.fetch
  const fixtureRule: StreamRule = { ...rule, playURL: 'video' }
  try {
    globalThis.fetch = async (input) => {
      const url = String(input)
      const html = url.includes('/search')
        ? '<div class="result"><span class="name">Fixture Anime</span><a href="/detail">detail</a></div>'
        : url.includes('/detail')
          ? '<div class="episode"><a href="/episode/1">第 1 集</a></div>'
          : '<video src="/media/episode-1.m3u8"></video>'
      return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } })
    }
    const sources = await aggregateStreams([{ title: 'Fixture Anime' }], { ...config, streamRules: [fixtureRule] })
    assert.equal(sources.length, 1)
    assert.equal(sources[0].episodes.length, 1)
    const qualities = await resolveStream(sources[0], sources[0].episodes[0], fixtureRule, config)
    assert.deepEqual(qualities.map((item) => item.format), ['hls'])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('media proxy recalculates Content-Length after rewriting an HLS playlist', async () => {
  const playlist = '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="keys/secret.key"\nsegment.ts\n'
  const originalFetch = globalThis.fetch
  const server = createServer((req, res) => { void handleMedia(req, res, config) })
  try {
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (url.startsWith('http://127.0.0.1:')) return originalFetch(input, init)
      return new Response(playlist, {
        headers: {
          'content-type': 'application/vnd.apple.mpegurl',
          'content-length': String(Buffer.byteLength(playlist)),
        },
      })
    }
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    const target = 'https://media.example.test/path/master.m3u8'
    const response = await originalFetch(`http://127.0.0.1:${address.port}/anime-find/media?url=${encodeURIComponent(target)}`)
    const body = await response.text()
    assert.match(body, /keys%2Fsecret\.key/)
    assert.match(body, /segment\.ts/)
    assert.equal(Number(response.headers.get('content-length')), Buffer.byteLength(body))
    assert.ok(Buffer.byteLength(body) > Buffer.byteLength(playlist))
  } finally {
    globalThis.fetch = originalFetch
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

test('HLS player asset is served from the ToolView script path', async () => {
  const server = createServer((_req, res) => { void handleHlsAsset(res) })
  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    const response = await fetch(`http://127.0.0.1:${address.port}/plugins/anime-find/hls.min.js`)
    const body = await response.text()
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type') || '', /^text\/javascript/)
    assert.match(body, /Hls/)
    assert.equal(Number(response.headers.get('content-length')), Buffer.byteLength(body))
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

test('resolve rejects an episode outside its rule domain before fetching', async () => {
  const source: StreamSource = {
    id: 'source',
    animeTitle: 'Demo',
    ruleId: rule.id,
    ruleName: rule.name,
    lineName: 'line',
    sourceUrl: 'https://media.example.test/detail',
    episodes: [],
    status: 'ready',
  }
  assert.equal(isAllowedForRule('http://127.0.0.1/private', rule), false)
  await assert.rejects(
    resolveStream(source, { id: 'episode', name: '1', pageUrl: 'http://127.0.0.1/private' }, rule, config),
    /不在当前规则允许域内/,
  )
})
