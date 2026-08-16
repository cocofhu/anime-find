const PLUGIN_SCRIPT_PATH = '/plugins/anime-find/client.js'

export function prefixFromPluginUrl(src: string, base = 'http://local/'): string {
  try {
    const path = new URL(src, base).pathname
    const idx = path.indexOf(PLUGIN_SCRIPT_PATH)
    if (idx <= 0) return ''
    return path.slice(0, idx).replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function prefixFromPathname(pathname: string): string {
  const first = (pathname || '/').split('/').filter(Boolean)[0]
  if (!first || !/^[A-Za-z0-9_-]{16,}$/.test(first)) return ''
  return `/${first}`
}

export function prefixFromBaseHref(href: string, pagePath = '/'): string {
  try {
    const path = new URL(href, `http://local${pagePath.startsWith('/') ? pagePath : `/${pagePath}`}`).pathname.replace(/\/+$/, '')
    return path && path !== '/' ? path : ''
  } catch {
    return ''
  }
}

export function resolveSitePrefix(input: {
  scriptUrls?: string[]
  pathname?: string
  baseHref?: string
}): string {
  for (const src of input.scriptUrls || []) {
    const prefix = prefixFromPluginUrl(src)
    if (prefix) return prefix
  }
  if (input.baseHref) {
    const prefix = prefixFromBaseHref(input.baseHref, input.pathname)
    if (prefix) return prefix
  }
  return prefixFromPathname(input.pathname || '/')
}

export function pluginUrl(path: string, prefix = ''): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${prefix}${suffix}`
}
