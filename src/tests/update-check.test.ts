import assert from 'node:assert/strict'
import test from 'node:test'
import { HttpError } from '../http.js'
import { checkForUpdate, classifyInstallSource, compareVersions, normalizeVersion } from '../update-check.js'

const githubMetadata = {
  currentVersion: '0.1.0',
  installSource: 'github' as const,
  installReference: 'github:cocofhu/anime-find',
  updateCommand: 'dsh plugin --profile web update anime-find',
}

const npmMetadata = {
  ...githubMetadata,
  installSource: 'npm' as const,
  installReference: '^0.1.7',
}

const localMetadata = {
  ...githubMetadata,
  installSource: 'local' as const,
  installReference: 'link:/workspace/anime-find',
}

const options = { timeoutMs: 1000, userAgent: 'test' }

test('normalizes and compares release versions', () => {
  assert.equal(normalizeVersion('v1.2.3'), '1.2.3')
  assert.equal(normalizeVersion('release-1.2.3'), undefined)
  assert.ok(compareVersions('1.2.0', '1.1.9') > 0)
  assert.ok(compareVersions('1.2.0', '1.2.1') < 0)
  assert.equal(compareVersions('1.2.0', '1.2.0'), 0)
})

test('classifies GitHub, npm and local install references', () => {
  assert.equal(classifyInstallSource('github:cocofhu/anime-find'), 'github')
  assert.equal(classifyInstallSource('^0.1.7'), 'npm')
  assert.equal(classifyInstallSource('0.1.7'), 'npm')
  assert.equal(classifyInstallSource('https://registry.npmjs.org/anime-find/-/anime-find-0.1.7.tgz'), 'npm')
  assert.equal(classifyInstallSource('link:/workspace/anime-find'), 'local')
  assert.equal(classifyInstallSource('file:../anime-find'), 'local')
  assert.equal(classifyInstallSource(undefined), 'unknown')
})

test('reports an available update for an npm install', async () => {
  const result = await checkForUpdate(npmMetadata, options, async () => ({ tag_name: 'v0.2.0' }))
  assert.equal(result.status, 'updateAvailable')
  assert.equal(result.latestVersion, '0.2.0')
})

test('reports an available update for a GitHub install', async () => {
  const result = await checkForUpdate(githubMetadata, options, async () => ({ tag_name: 'v0.2.0' }))
  assert.equal(result.status, 'updateAvailable')
  assert.equal(result.latestVersion, '0.2.0')
})

test('reports a restricted update for local installs', async () => {
  const result = await checkForUpdate(localMetadata, options, async () => ({ tag_name: 'v0.2.0' }))
  assert.equal(result.status, 'localInstallRestricted')
  assert.equal(result.latestVersion, '0.2.0')
})

test('reports up to date when remote is equal or lower', async () => {
  const result = await checkForUpdate(githubMetadata, options, async () => ({ tag_name: 'v0.1.0' }))
  assert.equal(result.status, 'upToDate')
})

test('maps a missing latest release to noRelease', async () => {
  const result = await checkForUpdate(githubMetadata, options, async () => {
    throw new HttpError('not found', 404)
  })
  assert.equal(result.status, 'noRelease')
})

test('maps invalid releases and request failures without claiming up to date', async () => {
  const invalid = await checkForUpdate(githubMetadata, options, async () => ({ tag_name: 'latest' }))
  assert.equal(invalid.status, 'noRelease')
  const failed = await checkForUpdate(githubMetadata, options, async () => {
    throw new HttpError('server error', 500)
  })
  assert.equal(failed.status, 'failed')
})
