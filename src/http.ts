import type { FetchOptions } from './types.js'

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

export async function fetchText(url: string, options: FetchOptions, signal?: AbortSignal): Promise<string> {
  const res = await request(url, options, signal)
  return res.text()
}

export async function fetchJson<T>(url: string, options: FetchOptions, signal?: AbortSignal, init?: { method?: string; body?: string }): Promise<T> {
  const res = await request(url, options, signal, init)
  return res.json() as Promise<T>
}

export async function fetchBytes(url: string, options: FetchOptions, signal?: AbortSignal): Promise<{ body: Buffer; contentType: string }> {
  const res = await request(url, options, signal)
  const buf = Buffer.from(await res.arrayBuffer())
  return { body: buf, contentType: res.headers.get('content-type') || 'application/octet-stream' }
}

async function request(url: string, options: FetchOptions, signal?: AbortSignal, init?: { method?: string; body?: string }): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), options.timeoutMs)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const headers: Record<string, string> = { 'user-agent': options.userAgent, accept: init?.body ? 'application/json' : '*/*' }
    if (init?.body) headers['content-type'] = 'application/json'
    const res = await fetch(url, {
      signal: ctrl.signal,
      method: init?.method,
      headers,
      body: init?.body,
    })
    if (!res.ok) throw new HttpError(`HTTP ${res.status} ${url}`, res.status)
    return res
  } catch (err) {
    if (err instanceof HttpError) throw err
    const name = err instanceof Error ? err.name : ''
    if (name === 'AbortError') throw new HttpError(`timeout ${options.timeoutMs}ms ${url}`)
    throw new HttpError(err instanceof Error ? err.message : String(err))
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

export function absUrl(host: string, href: string | undefined): string {
  if (!href) return ''
  if (/^https?:\/\//i.test(href)) return href
  return `${host.replace(/\/$/, '')}${href.startsWith('/') ? '' : '/'}${href}`
}

export function formatSize(n: number): string {
  if (!Number.isFinite(n) || n < 0) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  return i === 0 ? `${Math.round(v)} ${units[i]}` : `${v.toFixed(2)} ${units[i]}`
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
}
