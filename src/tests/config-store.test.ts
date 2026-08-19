import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { describe } from 'node:test'
import {
  assignConfig,
  decideOverlayMigration,
  DEFAULT_SOURCES,
  DEFAULT_STREAM_RULES,
  loadOverlayForMigration,
  overlayBackupPath,
  overlayPath,
  persistableSection,
  publicConfig,
  sanitizePatch,
  sanitizeSources,
  sanitizeStreamRules,
  userSectionIsEmpty,
} from '../config-store.js'
import type { PluginConfig, StreamRule } from '../types.js'

const live = (): PluginConfig => ({
  mikanHost: 'https://mikanani.me',
  anibtHost: 'https://anibt.net',
  gardenHost: 'https://api.animes.garden',
  timeoutMs: 20000,
  userAgent: 'Mozilla/5.0 (compatible; anime-find/0.1)',
  maxResults: 12,
  sources: ['mikan'],
  streamEnabled: true,
  streamRules: DEFAULT_STREAM_RULES.map((rule) => structuredClone(rule)),
})

const demoRule: StreamRule = {
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

test('sanitizePatch trims hosts and clamps timeout/maxResults', () => {
  const patch = sanitizePatch({
    mikanHost: '  https://mikan.example  ',
    anibtHost: ' https://anibt.example ',
    gardenHost: 'https://garden.example',
    timeoutMs: 999999,
    maxResults: 1000,
  })
  assert.equal(patch.mikanHost, 'https://mikan.example')
  assert.equal(patch.anibtHost, 'https://anibt.example')
  assert.equal(patch.gardenHost, 'https://garden.example')
  assert.equal(patch.timeoutMs, 120000)
  assert.equal(patch.maxResults, 80)
})

test('sanitizePatch rejects timeout below 3000 and maxResults below 1', () => {
  const patch = sanitizePatch({ timeoutMs: 2999, maxResults: 0 })
  assert.equal(patch.timeoutMs, undefined)
  assert.equal(patch.maxResults, undefined)
})

test('sanitizePatch falls back illegal sources and ignores garbage keys', () => {
  const patch = sanitizePatch({
    sources: ['not-a-source', 12],
    junk: true,
    apiKey: 'secret',
  } as Record<string, unknown>)
  assert.deepEqual(patch.sources, DEFAULT_SOURCES)
  assert.equal('junk' in patch, false)
  assert.equal('apiKey' in patch, false)
})

test('sanitizePatch drops private stream rule origins', () => {
  const patch = sanitizePatch({
    streamRules: [
      { ...demoRule, baseURL: 'http://127.0.0.1' },
      { ...demoRule, id: 'ok' },
    ],
  })
  assert.equal(patch.streamRules?.length, 1)
  assert.equal(patch.streamRules?.[0].id, 'ok')
  assert.deepEqual(sanitizeStreamRules([{ ...demoRule, baseURL: 'http://192.168.0.1' }]), [])
})

test('publicConfig omits userAgent and keeps sources/streamRules', () => {
  const cfg = live()
  cfg.sources = ['mikan', 'garden']
  cfg.streamEnabled = false
  const pub = publicConfig(cfg)
  assert.equal('userAgent' in pub, false)
  assert.deepEqual(pub.sources, ['mikan', 'garden'])
  assert.equal(pub.streamEnabled, false)
  assert.ok(Array.isArray(pub.streamRules) && pub.streamRules.length >= 1)
  assert.equal(pub.timeoutMs, 20000)
  assert.equal(pub.maxResults, 12)
})

test('persistableSection strips userAgent from a sanitized overlay', () => {
  const section = persistableSection(sanitizePatch({
    sources: ['anibt'],
    userAgent: 'should-not-persist',
  }))
  assert.deepEqual(section.sources, ['anibt'])
  assert.equal('userAgent' in section, false)
})

test('assignConfig copies sanitized fields onto the live object', () => {
  const cfg = live()
  assignConfig(cfg, sanitizePatch({
    timeoutMs: 8000,
    sources: ['garden'],
    streamEnabled: false,
  }))
  assert.equal(cfg.timeoutMs, 8000)
  assert.deepEqual(cfg.sources, ['garden'])
  assert.equal(cfg.streamEnabled, false)
})

test('userSectionIsEmpty treats missing and {} as empty', () => {
  assert.equal(userSectionIsEmpty(undefined), true)
  assert.equal(userSectionIsEmpty(null), true)
  assert.equal(userSectionIsEmpty({}), true)
  assert.equal(userSectionIsEmpty({ sources: ['mikan'] }), false)
})

test('decideOverlayMigration: no user + overlay with keys → import', () => {
  assert.equal(decideOverlayMigration({ sources: ['garden'] }, undefined), 'import')
  assert.equal(decideOverlayMigration({ streamRules: [demoRule] }, {}), 'import')
})

test('decideOverlayMigration: user already has keys → skip', () => {
  assert.equal(decideOverlayMigration({ sources: ['garden'] }, { sources: ['mikan'] }), 'skip')
  assert.equal(decideOverlayMigration({ timeoutMs: 9000 }, { streamEnabled: true }), 'skip')
})

test('decideOverlayMigration: corrupt or empty overlay → skip and would not overwrite', () => {
  assert.equal(decideOverlayMigration(null, undefined), 'skip')
  assert.equal(decideOverlayMigration({}, undefined), 'skip')
  assert.equal(decideOverlayMigration(null, { sources: ['mikan'] }), 'skip')
})

describe('legacy overlay file helpers', { concurrency: false }, () => {
  const prevHome = process.env.DSH_HOME

  test('loadOverlayForMigration reads a parseable json and reports missing files', (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'anime-find-overlay-'))
    t.after(() => {
      process.env.DSH_HOME = prevHome
      rmSync(dir, { recursive: true, force: true })
    })
    process.env.DSH_HOME = dir
    assert.deepEqual(loadOverlayForMigration(), { exists: false, overlay: null })
    writeFileSync(overlayPath(), JSON.stringify({ sources: ['garden'], timeoutMs: 7000 }))
    const loaded = loadOverlayForMigration()
    assert.equal(loaded.exists, true)
    assert.deepEqual(loaded.overlay?.sources, ['garden'])
    assert.equal(loaded.overlay?.timeoutMs, 7000)
  })

  test('loadOverlayForMigration treats corrupt json as unimportable', (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'anime-find-overlay-'))
    t.after(() => {
      process.env.DSH_HOME = prevHome
      rmSync(dir, { recursive: true, force: true })
    })
    process.env.DSH_HOME = dir
    writeFileSync(overlayPath(), '{not json')
    assert.deepEqual(loadOverlayForMigration(), { exists: true, overlay: null })
    writeFileSync(overlayPath(), '[]')
    assert.deepEqual(loadOverlayForMigration(), { exists: true, overlay: null })
  })

  test('sanitizeSources still matches existing parse tests', () => {
    assert.deepEqual(sanitizeSources(['mikan', 'garden', 'mikan']), ['mikan', 'garden'])
    assert.deepEqual(sanitizeSources(['nope']), DEFAULT_SOURCES)
  })
})
