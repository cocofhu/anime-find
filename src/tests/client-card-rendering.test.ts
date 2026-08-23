import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

test('cards skip rendering work while scrolled out of view', () => {
  // 视口外的卡片如果仍参与布局/栅格化,窗口 resize 和拖动侧边栏会把整条会话
  // 反复重算 —— 130 张卡片实测每次 resize 1149ms,加上 content-visibility 后 57ms。
  assert.match(client, /\.af-card\{[^}]*content-visibility:auto/)
})

test('card placeholder keeps its measured height so the scrollbar does not jump', () => {
  // auto 关键字让浏览器记住实测高度;后面的长度只是首次渲染前的占位估值。
  assert.match(client, /\.af-card\{[^}]*contain-intrinsic-size:auto \d+px/)
})

test('resource list renders an auto-fill card grid instead of a single column', () => {
  // repeat(auto-fill,minmax(min(250px,100%),1fr)):宽容器 2~3 列,窄容器自动降为单列;
  // min(250px,100%) 保证容器比 250px 还窄时轨道不再撑破聊天容器。
  // 回退成 1fr(单列)会让 36 条结果重新需要长距离滚动,这条断言拦住该回归。
  assert.match(client, /\.af-cards\{[^}]*grid-template-columns:repeat\(auto-fill,minmax\(min\(250px,100%\),1fr\)\)/)
})

test('cards and their text containers cannot overflow the chat container', () => {
  // 网格项默认 min-width:auto,长标题/长原名会撑破列宽并顶出横向滚动条。
  // 卡片与信息列都显式 min-width:0,配合标题两行截断、原名单行省略、标签省略。
  assert.match(client, /\.af-card\{[^}]*min-width:0/)
  assert.match(client, /\.af-meta\{[^}]*min-width:0/)
  assert.match(client, /\.af-title\{[^}]*-webkit-line-clamp:2/)
  assert.match(client, /\.af-card \.af-original\{[^}]*white-space:nowrap[^}]*text-overflow:ellipsis/)
  assert.match(client, /\.af-tag\{[^}]*text-overflow:ellipsis/)
})
