import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { formatSearchItem, httpCoverUrl, parseRenderedSearch, SEARCH_ITEM_RE } from '../search-text.js'

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const host = readFileSync(new URL('../host.js', import.meta.url), 'utf8')

test('formatSearchItem writes cover URLs for replay, never magnets', () => {
  const withCover = formatSearchItem(1, {
    title: '无职转生 第三季',
    score: 7.9,
    sources: ['mikan', 'anibt'],
    id: 'mikan:3060',
    cover: 'https://mikanani.me/images/Bangumi/s2.jpg',
  })
  assert.equal(
    withCover,
    '1. 无职转生 第三季 ★7.9 [mikan+anibt]\n   id: mikan:3060\n   cover: https://mikanani.me/images/Bangumi/s2.jpg',
  )
  assert.doesNotMatch(withCover, /magnet:/)

  const withoutCover = formatSearchItem(2, {
    title: '凡人修仙传',
    sources: ['mikan'],
    id: 'mikan:1234',
    cover: 'magnet:?xt=urn:btih:abc',
  })
  assert.equal(withoutCover, '2. 凡人修仙传 [mikan]\n   id: mikan:1234')
})

test('parseRenderedSearch round-trips covers and still reads old sessions', () => {
  const rendered = [
    formatSearchItem(1, {
      title: '无职转生 第三季',
      score: 7.9,
      sources: ['mikan'],
      id: 'mikan:3060',
      cover: 'https://mikanani.me/images/Bangumi/s2.jpg?x=1',
    }),
    '2. 旧会话卡片 ★8.0 [mikan]\n   id: mikan:1234',
  ].join('\n')

  const parsed = parseRenderedSearch(`找到 2 条，已显示为可点击卡片。\n\n${rendered}`)
  assert.ok(parsed)
  assert.equal(parsed.items.length, 2)
  assert.equal(parsed.items[0].id, 'mikan:3060')
  assert.equal(parsed.items[0].cover, 'https://mikanani.me/images/Bangumi/s2.jpg?x=1')
  assert.equal(parsed.items[1].id, 'mikan:1234')
  assert.equal(parsed.items[1].cover, undefined)
  assert.equal(parsed.items[1].score, 8)
})

test('httpCoverUrl only accepts http(s) URLs', () => {
  assert.equal(httpCoverUrl('https://mikanani.me/a.jpg'), 'https://mikanani.me/a.jpg')
  assert.equal(httpCoverUrl('http://cdn.example/a.jpg'), 'http://cdn.example/a.jpg')
  assert.equal(httpCoverUrl('magnet:?xt=urn:btih:abc'), undefined)
  assert.equal(httpCoverUrl('javascript:alert(1)'), undefined)
  assert.equal(httpCoverUrl(''), undefined)
})

test('client parser stays aligned with the shared search-text regex', () => {
  assert.match(host, /formatSearchItem\(/)
  assert.equal(client.includes(SEARCH_ITEM_RE.source), true)
  assert.match(client, /cover: httpCoverUrl\(m\[5\]\)/)
})
