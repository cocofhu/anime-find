import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleHlsAsset, handleMedia } from '../host.js'
import { isAllowedForRule, isAllowedStreamUrl, resolveStream, validateRule } from '../streaming.js'
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
  assert.match(clientSource, /"可播放"/)
  assert.match(clientSource, /"部分集受限"/)
  assert.match(clientSource, /"选集播放 ›"/)
})

test('media allowlist only accepts enabled rule domains', () => {
  assert.equal(isAllowedStreamUrl('https://cdn.media.example.test/a.m3u8', config)?.id, 'demo')
  assert.equal(isAllowedStreamUrl('https://untrusted.example/a.m3u8', config), undefined)
  assert.equal(isAllowedStreamUrl('file:///etc/passwd', config), undefined)
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
