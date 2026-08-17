import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

test('version update requires confirmation and invokes the apply API once', () => {
  assert.match(client, /window\.confirm\("将自动执行官方更新并重启 dsh web/)
  assert.match(client, /if \(!window\.confirm\(.+\)\) return;/)
  assert.match(client, /api\("applyUpdate", \{\}\)/)
  assert.match(client, /if \(applyingUpdate\) return;/)
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
