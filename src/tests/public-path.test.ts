import assert from 'node:assert/strict'
import test from 'node:test'
import { pluginUrl, prefixFromPathname, prefixFromPluginUrl, resolveSitePrefix } from '../public-path.js'

test('plugin script under a proxy prefix yields that prefix', () => {
  assert.equal(
    prefixFromPluginUrl('https://43.161.238.167:38012/p7fco3lmrlo69rpziq5xl0uv/plugins/anime-find/client.js?rev=abc'),
    '/p7fco3lmrlo69rpziq5xl0uv',
  )
})

test('plugin script at site root has no prefix', () => {
  assert.equal(prefixFromPluginUrl('http://127.0.0.1:3080/plugins/anime-find/client.js?rev=abc'), '')
  assert.equal(prefixFromPluginUrl('/plugins/anime-find/client.js'), '')
})

test('proxy token pathnames keep the first segment', () => {
  assert.equal(prefixFromPathname('/p7fco3lmrlo69rpziq5xl0uv/'), '/p7fco3lmrlo69rpziq5xl0uv')
  assert.equal(prefixFromPathname('/p7fco3lmrlo69rpziq5xl0uv'), '/p7fco3lmrlo69rpziq5xl0uv')
  assert.equal(prefixFromPathname('/p7fco3lmrlo69rpziq5xl0uv/settings'), '/p7fco3lmrlo69rpziq5xl0uv')
})

test('ordinary SPA paths are not treated as a proxy prefix', () => {
  assert.equal(prefixFromPathname('/'), '')
  assert.equal(prefixFromPathname('/settings'), '')
  assert.equal(prefixFromPathname('/workspace'), '')
})

test('resolveSitePrefix prefers the plugin script URL over the page path', () => {
  assert.equal(resolveSitePrefix({
    scriptUrls: ['https://host/p7fco3lmrlo69rpziq5xl0uv/plugins/anime-find/client.js'],
    pathname: '/',
  }), '/p7fco3lmrlo69rpziq5xl0uv')
  assert.equal(resolveSitePrefix({
    scriptUrls: ['/plugins/anime-find/client.js'],
    pathname: '/p7fco3lmrlo69rpziq5xl0uv/',
  }), '/p7fco3lmrlo69rpziq5xl0uv')
  assert.equal(resolveSitePrefix({
    scriptUrls: ['/plugins/anime-find/client.js'],
    pathname: '/',
  }), '')
})

test('pluginUrl joins the prefix and route', () => {
  assert.equal(pluginUrl('/anime-find'), '/anime-find')
  assert.equal(pluginUrl('/anime-find', '/p7fco3lmrlo69rpziq5xl0uv'), '/p7fco3lmrlo69rpziq5xl0uv/anime-find')
  assert.equal(
    pluginUrl('/anime-find/cover?url=https%3A%2F%2Fmikanani.me%2Fx.jpg', '/p7fco3lmrlo69rpziq5xl0uv'),
    '/p7fco3lmrlo69rpziq5xl0uv/anime-find/cover?url=https%3A%2F%2Fmikanani.me%2Fx.jpg',
  )
})
