import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

test('version update requires confirmation and invokes the apply API once', () => {
  assert.doesNotMatch(client, /window\.confirm\(/)
  assert.doesNotMatch(client, /window\.alert\(/)
  assert.match(client, /function UpdateConfirmDialog/)
  assert.match(client, /role: "dialog"/)
  assert.match(client, /确认执行更新？/)
  assert.match(client, /setConfirmUpdateOpen\(true\)/)
  assert.match(client, /api\("applyUpdate", \{\}\)/)
  assert.match(client, /if \(applyingUpdate\) return;/)
})

test('version update shows a spinning progress indicator while applying', () => {
  assert.match(client, /\.af-spin-inline\{/)
  assert.match(client, /@keyframes af-spin/)
  assert.match(client, /className: "af-spin-inline"/)
  assert.match(client, /正在执行官方更新并拉起新的 dsh web…/)
  assert.match(client, /更新中…/)
})

test('version update redirects only with a new successor URL', () => {
  assert.match(client, /if \(!result\.newUrl\) throw new Error/)
  assert.match(client, /window\.location\.assign\(result\.newUrl\)/)
  assert.match(client, /自动更新失败，请稍后重试/)
})

test('version update copy no longer claims manual installation or restart', () => {
  assert.doesNotMatch(client, /按钮仅复制命令，不会自动安装/)
  assert.doesNotMatch(client, /在终端执行更新命令后，请重启 dsh web/)
  assert.match(client, /确认后将自动执行更新并重启 dsh web/)
  assert.match(client, /官方更新命令/)
})

test('client module id matches the scoped npm package name', () => {
  assert.match(client, /id: "@cocofhu\/anime-find"/)
})

test('settings plugin card registers both list-slot id and keyed-slot key', () => {
  assert.match(client, /name: "settings\.plugin\.item", id: "anime-find", key: "anime-find"/)
})
