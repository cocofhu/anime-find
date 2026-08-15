import assert from 'node:assert/strict'
import test from 'node:test'
import { formatSize } from '../http.js'

test('formatSize', () => {
  assert.equal(formatSize(512), '512 B')
  assert.equal(formatSize(1024), '1.00 KB')
  assert.equal(formatSize(412 * 1024 * 1024), '412.00 MB')
})
