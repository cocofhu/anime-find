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
