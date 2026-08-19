import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

test('replayed search blocks hydrate missing covers from the search API', () => {
  assert.match(client, /const \[hydrated, setHydrated\] = useState\(null\)/)
  assert.match(client, /!item\.cover && item\.id/)
  assert.match(client, /hydrateSearch\(\{ query, limit, offset \}\)/)
  assert.match(client, /const items = hydrated \|\| fromTool \|\| fetched \|\| \[\]/)
})

test('cover hydration keys off block content, never object identity', () => {
  // pickPayload 每次渲染都会生成新的 items 数组；如果 effect 依赖对象引用，
  // 合并结果触发的重渲染会让 effect 再次执行，搜索请求无限循环。
  assert.match(client, /\[query, running, fromToolKey, args\.limit, args\.offset\]/)
  assert.doesNotMatch(client, /\[query, running, fromTool, args\.limit, args\.offset\]/)
  assert.match(client, /const hydratedFor = useRef\(""\)/)
  assert.match(client, /if \(hydratedFor\.current === key\) return/)
})

test('identical hydration searches share one in-flight request', () => {
  assert.match(client, /const hydrateSearchCache = new Map\(\)/)
  assert.match(client, /hydrateSearchCache\.set\(key, pending\)/)
  assert.match(client, /pending\.catch\(\(\) => hydrateSearchCache\.delete\(key\)\)/)
})
