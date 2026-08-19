import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import test, { describe } from 'node:test'
import type { Context } from '@deepseek-ai/cordis'
import { apply, applyResolvedSettings, handleApi } from '../host.js'
import {
  overlayBackupPath,
  overlayPath,
  publicConfig,
  sanitizePatch,
} from '../config-store.js'
import type { PluginConfig, StreamRule } from '../types.js'

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

const baseConfig = (): PluginConfig => ({
  mikanHost: 'https://mikanani.me',
  anibtHost: 'https://anibt.net',
  gardenHost: 'https://api.animes.garden',
  timeoutMs: 20000,
  userAgent: 'test-agent',
  maxResults: 12,
  sources: ['mikan'],
  streamEnabled: true,
  streamRules: [rule],
})

type SettingsMock = {
  settings: {
    register: (ns: string, schema: unknown, options?: unknown) => {
      get: () => unknown
      watch: (cb: () => void) => () => void
      replace: (section: object) => Promise<unknown>
    }
    describe: () => Array<{ ns: string; user?: unknown }>
    replace: (ns: string, section: object) => Promise<unknown>
  }
  replaces: object[]
  registers: string[]
  fireWatch: () => void
  resolved: PluginConfig
}

function memorySettings(initial?: { user?: Record<string, unknown>; resolved?: PluginConfig }): SettingsMock {
  const resolved = initial?.resolved ? structuredClone(initial.resolved) : baseConfig()
  let user = initial?.user
  const replaces: object[] = []
  const registers: string[] = []
  const watchers: Array<() => void> = []
  const settings = {
    register(ns: string) {
      registers.push(ns)
      return {
        get: () => Object.freeze(structuredClone(resolved)),
        watch(cb: () => void) {
          watchers.push(cb)
          return () => {}
        },
        replace: (section: object) => settings.replace(ns, section),
      }
    },
    describe() {
      return [{ ns: 'anime-find', user }]
    },
    async replace(_ns: string, section: object) {
      replaces.push(structuredClone(section))
      user = section as Record<string, unknown>
      Object.assign(resolved, section)
      for (const watcher of watchers) watcher()
    },
  }
  return {
    settings,
    replaces,
    registers,
    fireWatch: () => {
      for (const watcher of watchers) watcher()
    },
    resolved,
  }
}

function createCtx(settings?: SettingsMock['settings']) {
  const tools: unknown[] = []
  const routes: Array<{ path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }> = []
  const ctx = {
    fiber: { state: 0 },
    tools: {
      register(tool: unknown) {
        tools.push(tool)
      },
    },
    inject(deps: string[], fn: (scoped: unknown) => void) {
      if (deps.includes('systemPrompt')) {
        fn({ systemPrompt: { section() {} } })
        return
      }
      if (deps.includes('webServer')) {
        fn({
          webServer: {
            register(route: { path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }) {
              routes.push(route)
            },
          },
        })
        return
      }
      if (deps.includes('settings')) {
        if (!settings) return
        fn({
          settings,
          effect(factory: () => () => void) {
            factory()
          },
        })
      }
    },
  }
  return { ctx: ctx as unknown as Context, tools, routes }
}

function mockReq(body: Record<string, unknown>): IncomingMessage {
  const stream = Readable.from([JSON.stringify(body)]) as IncomingMessage
  stream.method = 'POST'
  stream.url = '/anime-find'
  return stream
}

function mockRes(): ServerResponse & { body: string } {
  const res = {
    statusCode: 0,
    body: '',
    setHeader() {},
    end(chunk?: unknown) {
      this.body = typeof chunk === 'string' ? chunk : chunk == null ? '' : String(chunk)
    },
  }
  return res as unknown as ServerResponse & { body: string }
}

describe('host settings persistence', { concurrency: false }, () => {
  const prevHome = process.env.DSH_HOME

  test('config save calls settings.replace with publicConfig and does not write json', async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'anime-find-host-'))
    t.after(() => {
      process.env.DSH_HOME = prevHome
      rmSync(dir, { recursive: true, force: true })
    })
    process.env.DSH_HOME = dir
    const cfg = baseConfig()
    const mock = memorySettings({ resolved: cfg })
    const res = mockRes()
    await handleApi(mockReq({
      method: 'config',
      save: true,
      sources: ['garden'],
      timeoutMs: 9000,
      userAgent: 'should-not-land',
    }), res, cfg, () => mock.settings)
    assert.equal(res.statusCode, 200)
    assert.equal(mock.replaces.length, 1)
    const payload = mock.replaces[0] as Record<string, unknown>
    assert.deepEqual(payload.sources, ['garden'])
    assert.equal(payload.timeoutMs, 9000)
    assert.equal('userAgent' in payload, false)
    assert.deepEqual(payload, publicConfig(cfg))
    assert.equal(existsSync(overlayPath()), false)
  })

  test('config save fails without settings and does not create json or mutate cfg', async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'anime-find-host-'))
    t.after(() => {
      process.env.DSH_HOME = prevHome
      rmSync(dir, { recursive: true, force: true })
    })
    process.env.DSH_HOME = dir
    const cfg = baseConfig()
    const res = mockRes()
    await handleApi(mockReq({
      method: 'config',
      save: true,
      sources: ['garden'],
    }), res, cfg, () => undefined)
    assert.equal(res.statusCode, 503)
    assert.match(res.body, /settings 服务不可用/)
    assert.deepEqual(cfg.sources, ['mikan'])
    assert.equal(existsSync(overlayPath()), false)
  })

  test('migrate imports overlay when user section is empty then renames to .bak', async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'anime-find-host-'))
    t.after(() => {
      process.env.DSH_HOME = prevHome
      rmSync(dir, { recursive: true, force: true })
    })
    process.env.DSH_HOME = dir
    writeFileSync(overlayPath(), `${JSON.stringify({
      sources: ['anibt', 'garden'],
      streamRules: [rule],
      timeoutMs: 11000,
    }, null, 2)}\n`)
    const mock = memorySettings({ user: undefined, resolved: baseConfig() })
    const { ctx, tools, routes } = createCtx(mock.settings)
    apply(ctx, baseConfig())
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(mock.registers.length, 1)
    assert.equal(mock.registers[0], 'anime-find')
    assert.equal(mock.replaces.length, 1)
    const payload = mock.replaces[0] as Record<string, unknown>
    assert.deepEqual(payload.sources, ['anibt', 'garden'])
    assert.ok(Array.isArray(payload.streamRules))
    assert.equal(existsSync(overlayPath()), false)
    assert.equal(existsSync(overlayBackupPath()), true)
    assert.match(readFileSync(overlayBackupPath(), 'utf8'), /anibt/)
    const api = routes.find((route) => route.path === '/anime-find')
    assert.ok(api)
    const peek = mockRes()
    await api.handler(mockReq({ method: 'config' }), peek)
    const live = JSON.parse(peek.body) as { sources: string[]; streamRules: StreamRule[] }
    assert.deepEqual(live.sources, ['anibt', 'garden'])
    const toolCount = tools.length
    mock.resolved.sources = ['garden']
    mock.resolved.streamRules = [{ ...rule, id: 'after-change' }]
    mock.fireWatch()
    assert.equal(tools.length, toolCount)
    const after = mockRes()
    await api.handler(mockReq({ method: 'config' }), after)
    const updated = JSON.parse(after.body) as { sources: string[]; streamRules: StreamRule[] }
    assert.deepEqual(updated.sources, ['garden'])
    assert.equal(updated.streamRules[0].id, 'after-change')
  })

  test('migrate skips when user section exists and still renames json to .bak', async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'anime-find-host-'))
    t.after(() => {
      process.env.DSH_HOME = prevHome
      rmSync(dir, { recursive: true, force: true })
    })
    process.env.DSH_HOME = dir
    writeFileSync(overlayPath(), `${JSON.stringify({ sources: ['garden'] })}\n`)
    const mock = memorySettings({
      user: { sources: ['mikan'] },
      resolved: { ...baseConfig(), sources: ['mikan'] },
    })
    const { ctx } = createCtx(mock.settings)
    apply(ctx, baseConfig())
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(mock.replaces.length, 0)
    assert.equal(existsSync(overlayPath()), false)
    assert.equal(existsSync(overlayBackupPath()), true)
  })

  test('onChange copies resolved settings into live cfg and ignores leftover bak', async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'anime-find-host-'))
    t.after(() => {
      process.env.DSH_HOME = prevHome
      rmSync(dir, { recursive: true, force: true })
    })
    process.env.DSH_HOME = dir
    writeFileSync(overlayBackupPath(), JSON.stringify({ sources: ['anibt'] }))
    const cfg = baseConfig()
    applyResolvedSettings(cfg, () => ({
      ...baseConfig(),
      sources: ['garden'],
      streamRules: [{ ...rule, id: 'from-settings' }],
    }))
    assert.deepEqual(cfg.sources, ['garden'])
    assert.equal(cfg.streamRules[0].id, 'from-settings')
    const again = sanitizePatch(JSON.parse(readFileSync(overlayBackupPath(), 'utf8')) as Record<string, unknown>)
    assert.deepEqual(again.sources, ['anibt'])
    assert.notDeepEqual(cfg.sources, again.sources)
  })

  test('apply without settings still loads and does not write overlay json', () => {
    const { ctx, tools } = createCtx()
    apply(ctx, baseConfig())
    assert.ok(tools.length >= 1)
    const cfg = baseConfig()
    const res = mockRes()
    return handleApi(mockReq({ method: 'config', save: true, sources: ['garden'] }), res, cfg, () => undefined).then(() => {
      assert.equal(res.statusCode, 503)
    })
  })
})
