import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fetchJson, HttpError } from './http.js'
import type { FetchOptions } from './types.js'

const require = createRequire(import.meta.url)
const REPOSITORY = 'cocofhu/anime-find'
export const DEFAULT_PROFILE = process.env.DSH_PROFILE || 'web'

export type InstallSource = 'github' | 'npm' | 'local' | 'unknown'
export type UpdateStatus = 'upToDate' | 'updateAvailable' | 'noRelease' | 'failed' | 'localInstallRestricted'

export interface VersionMetadata {
  currentVersion: string
  installSource: InstallSource
  installReference?: string
  updateCommand: string
}

export interface UpdateResult extends VersionMetadata {
  status: UpdateStatus
  latestVersion?: string
  message: string
}

interface PackageJson {
  version?: unknown
  dependencies?: Record<string, unknown>
}

interface ReleaseResponse {
  tag_name?: unknown
}

export function getVersionMetadata(profile = DEFAULT_PROFILE): VersionMetadata {
  const ownPackage = require('../package.json') as PackageJson
  const currentVersion = typeof ownPackage.version === 'string' ? ownPackage.version : '0.0.0'
  const installReference = readInstallReference(profile)
  const installSource = classifyInstallSource(installReference)
  return {
    currentVersion,
    installSource,
    ...(installReference ? { installReference } : {}),
    updateCommand: `dsh plugin --profile ${profile} update anime-find`,
  }
}

export async function checkForUpdate(
  metadata: VersionMetadata,
  options: FetchOptions,
  getLatest: (url: string, options: FetchOptions) => Promise<ReleaseResponse> = fetchJson,
): Promise<UpdateResult> {
  try {
    const release = await getLatest(`https://api.github.com/repos/${REPOSITORY}/releases/latest`, options)
    const latestVersion = normalizeVersion(release.tag_name)
    if (!latestVersion) return result(metadata, 'noRelease', '暂无可用 Release，无法判断是否有更新。')
    if (compareVersions(latestVersion, metadata.currentVersion) <= 0) {
      return result(metadata, 'upToDate', `已是最新版本（当前 ${metadata.currentVersion}）。`, latestVersion)
    }
    if (!canAutoUpdate(metadata.installSource)) {
      return result(metadata, 'localInstallRestricted', '发现新正式版，但当前为本地或未知安装来源，请自行同步后重启。', latestVersion)
    }
    return result(metadata, 'updateAvailable', '发现新正式版，可按官方命令更新。', latestVersion)
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      return result(metadata, 'noRelease', '暂无可用 Release，无法判断是否有更新。')
    }
    return result(metadata, 'failed', '检查失败：无法连接 GitHub 或查询出错，请稍后重试。')
  }
}

export function normalizeVersion(value: unknown): string | undefined {
  const normalized = String(value || '').trim().replace(/^v/i, '')
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(normalized) ? normalized : undefined
}

export function compareVersions(left: string, right: string): number {
  const a = parseVersion(left)
  const b = parseVersion(right)
  if (!a || !b) return 0
  for (let i = 0; i < 3; i += 1) {
    if (a.parts[i] !== b.parts[i]) return a.parts[i] > b.parts[i] ? 1 : -1
  }
  if (a.pre === b.pre) return 0
  if (!a.pre) return 1
  if (!b.pre) return -1
  return a.pre.localeCompare(b.pre, undefined, { numeric: true })
}

export function canAutoUpdate(source: InstallSource): boolean {
  return source === 'github' || source === 'npm'
}

export function classifyInstallSource(reference?: string): InstallSource {
  if (!reference) return 'unknown'
  if (/^(github:|git\+https?:\/\/github\.com\/)/i.test(reference)) return 'github'
  if (/^(link:|file:|\.{1,2}\/|\/)/i.test(reference)) return 'local'
  if (/^(npm:|https?:\/\/registry\.npmjs\.org\/)/i.test(reference)) return 'npm'
  if (/^[~^>=<]*\d+\.\d+\.\d+/.test(reference.trim())) return 'npm'
  return 'unknown'
}

function readInstallReference(profile: string): string | undefined {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  const path = join(home, 'profiles', profile, 'package.json')
  if (!existsSync(path)) return undefined
  try {
    const pkg = JSON.parse(readFileSync(path, 'utf8')) as PackageJson
    const value = pkg.dependencies?.['anime-find']
    return typeof value === 'string' ? value : undefined
  } catch {
    return undefined
  }
}

function result(metadata: VersionMetadata, status: UpdateStatus, message: string, latestVersion?: string): UpdateResult {
  return { ...metadata, status, ...(latestVersion ? { latestVersion } : {}), message }
}

function parseVersion(value: string): { parts: number[]; pre: string } | undefined {
  const normalized = normalizeVersion(value)
  if (!normalized) return undefined
  const [core, suffix = ''] = normalized.split('-', 2)
  return { parts: core.split('.').map(Number), pre: suffix.split('+', 1)[0] }
}
