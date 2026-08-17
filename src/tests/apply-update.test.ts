import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import { applyPluginUpdate, buildSuccessorWebArgv, buildUpdateArgv, parseSuccessorWebUrl } from '../apply-update.js'

const githubMetadata = {
  currentVersion: '0.1.0',
  installSource: 'github' as const,
  installReference: 'github:cocofhu/anime-find',
  updateCommand: 'dsh plugin --profile web update anime-find',
}

function fakeChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: PassThrough
    stderr: PassThrough
    kill: () => void
    unref: () => void
  }
  child.stdout = new PassThrough()
  child.stderr = new PassThrough()
  child.kill = () => {}
  child.unref = () => {}
  return child
}

test('uses fixed argv and parses successor web URL', () => {
  assert.deepEqual(buildUpdateArgv('team'), ['plugin', '--profile', 'team', 'update', 'anime-find'])
  assert.deepEqual(buildSuccessorWebArgv('team'), ['--profile', 'team', '--port', '0'])
  assert.equal(parseSuccessorWebUrl('ready\ndsh web: http://127.0.0.1:48123/path\n'), 'http://127.0.0.1:48123/path')
})

test('refuses local and unknown installations before spawning', async () => {
  let calls = 0
  const spawn = (() => {
    calls += 1
    return fakeChild()
  }) as never
  const local = await applyPluginUpdate({ ...githubMetadata, installSource: 'local' }, 'web', { spawn })
  const unknown = await applyPluginUpdate({ ...githubMetadata, installSource: 'unknown' }, 'web', { spawn })
  assert.equal(local.ok, false)
  assert.equal(unknown.ok, false)
  assert.equal(calls, 0)
})

test('updates then starts a successor and returns its URL', async () => {
  const calls: Array<{ command: string; args: string[] }> = []
  const children = [fakeChild(), fakeChild()]
  const spawn = ((command: string, args: string[]) => {
    calls.push({ command, args })
    const child = children.shift()
    if (!child) throw new Error('unexpected spawn')
    if (calls.length === 1) queueMicrotask(() => child.emit('close', 0))
    else queueMicrotask(() => child.stdout.end('dsh web: http://127.0.0.1:43123\n'))
    return child
  }) as never
  let exited = false
  const result = await applyPluginUpdate(githubMetadata, 'web', {
    spawn,
    cliPath: '/tmp/dsh.js',
    scheduleExit: () => { exited = true },
  })
  assert.deepEqual(calls.map((call) => call.args), [
    ['/tmp/dsh.js', 'plugin', '--profile', 'web', 'update', 'anime-find'],
    ['/tmp/dsh.js', '--profile', 'web', '--port', '0'],
  ])
  assert.equal(result.ok, true)
  assert.equal(result.newUrl, 'http://127.0.0.1:43123')
  assert.equal(exited, true)
})

test('does not restart or schedule exit after a failed update', async () => {
  let calls = 0
  const spawn = (() => {
    calls += 1
    const child = fakeChild()
    queueMicrotask(() => {
      child.stderr.end('update failed')
      child.emit('close', 1)
    })
    return child
  }) as never
  let exited = false
  const result = await applyPluginUpdate(githubMetadata, 'web', {
    spawn,
    cliPath: '/tmp/dsh.js',
    scheduleExit: () => { exited = true },
  })
  assert.equal(result.ok, false)
  assert.match(result.error || '', /update failed/)
  assert.equal(calls, 1)
  assert.equal(exited, false)
})

test('rejects concurrent update attempts without a second spawn', async () => {
  const child = fakeChild()
  let calls = 0
  const spawn = (() => {
    calls += 1
    return child
  }) as never
  const first = applyPluginUpdate(githubMetadata, 'web', { spawn, cliPath: '/tmp/dsh.js' })
  const second = await applyPluginUpdate(githubMetadata, 'web', { spawn, cliPath: '/tmp/dsh.js' })
  assert.equal(second.ok, false)
  assert.match(second.error || '', /正在进行/)
  assert.equal(calls, 1)
  child.emit('close', 1)
  await first
})
