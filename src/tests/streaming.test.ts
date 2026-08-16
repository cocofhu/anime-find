import test from 'node:test'
import assert from 'node:assert/strict'
import { isAllowedForRule, isAllowedStreamUrl, resolveStream, validateRule } from '../streaming.js'
import type { PluginConfig, StreamRule, StreamSource } from '../types.js'

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

test('media allowlist only accepts enabled rule domains', () => {
  assert.equal(isAllowedStreamUrl('https://cdn.media.example.test/a.m3u8', config)?.id, 'demo')
  assert.equal(isAllowedStreamUrl('https://untrusted.example/a.m3u8', config), undefined)
  assert.equal(isAllowedStreamUrl('file:///etc/passwd', config), undefined)
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
