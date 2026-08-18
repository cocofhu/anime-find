import { spawn as nodeSpawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { canAutoUpdate, DEFAULT_PROFILE, type VersionMetadata } from './update-check.js'

const UPDATE_TIMEOUT_MS = 5 * 60_000
const WEB_START_TIMEOUT_MS = 30_000
const WEB_URL_PATTERN = /dsh web:\s*(https?:\/\/127\.0\.0\.1:\d+\S*)/i

export interface ApplyUpdateResult {
  ok: boolean
  error?: string
  newUrl?: string
}

export interface ApplyUpdateDependencies {
  spawn?: typeof nodeSpawn
  cliPath?: string
  timeoutMs?: number
  webTimeoutMs?: number
  scheduleExit?: () => void
}

interface CommandResult {
  code: number | null
  stdout: string
  stderr: string
}

let updating = false

export function buildUpdateArgv(profile = DEFAULT_PROFILE): string[] {
  return ['plugin', '--profile', profile, 'update', 'anime-find']
}

export function buildSuccessorWebArgv(profile = DEFAULT_PROFILE): string[] {
  return ['--profile', profile, '--port', '0']
}

export function parseSuccessorWebUrl(output: string): string | undefined {
  return output.match(WEB_URL_PATTERN)?.[1]
}

export async function applyPluginUpdate(
  metadata: VersionMetadata,
  profile = DEFAULT_PROFILE,
  dependencies: ApplyUpdateDependencies = {},
): Promise<ApplyUpdateResult> {
  if (!canAutoUpdate(metadata.installSource)) {
    return { ok: false, error: '当前为本地或未知安装来源，不能自动执行官方更新。' }
  }
  if (updating) return { ok: false, error: '已有更新正在进行，请稍候。' }

  updating = true
  try {
    const spawn = dependencies.spawn ?? nodeSpawn
    const cliPath = dependencies.cliPath ?? process.argv[1]
    if (!cliPath) return { ok: false, error: '无法定位 dsh CLI，不能执行更新。' }

    const update = await runCommand(spawn, cliPath, buildUpdateArgv(profile), dependencies.timeoutMs ?? UPDATE_TIMEOUT_MS)
    if (update.code !== 0) {
      return { ok: false, error: commandError('官方更新命令执行失败', update) }
    }

    const successor = await startSuccessor(
      spawn,
      cliPath,
      buildSuccessorWebArgv(profile),
      dependencies.webTimeoutMs ?? WEB_START_TIMEOUT_MS,
    )
    if (!successor.newUrl) {
      return { ok: false, error: commandError('更新已完成，但无法启动新的 dsh web', successor) }
    }

    const scheduleExit = dependencies.scheduleExit ?? (() => {
      const timer = setTimeout(() => process.exit(0), 250)
      timer.unref()
    })
    scheduleExit()
    return { ok: true, newUrl: successor.newUrl }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : '自动更新失败。' }
  } finally {
    updating = false
  }
}

function commandError(prefix: string, result: CommandResult): string {
  const detail = (result.stderr || result.stdout).trim().replace(/\s+/g, ' ').slice(0, 300)
  return detail ? `${prefix}：${detail}` : prefix
}

function runCommand(
  spawn: typeof nodeSpawn,
  cliPath: string,
  args: string[],
  timeoutMs: number,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    let settled = false
    let child: ChildProcess
    try {
      child = spawn(process.execPath, [cliPath, ...args], { stdio: ['ignore', 'pipe', 'pipe'], shell: false })
    } catch (error) {
      reject(error)
      return
    }
    let stdout = ''
    let stderr = ''
    child.stdout?.setEncoding('utf8').on('data', (chunk: string) => { stdout += chunk })
    child.stderr?.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk })
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        child.kill()
        reject(new Error('官方更新命令超时，请稍后重试。'))
      }
    }, timeoutMs)
    timer.unref()
    child.once('error', (error) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject(new Error(`无法启动 dsh CLI：${error.message}`))
      }
    })
    child.once('close', (code) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve({ code, stdout, stderr })
      }
    })
  })
}

async function startSuccessor(
  spawn: typeof nodeSpawn,
  cliPath: string,
  args: string[],
  timeoutMs: number,
): Promise<CommandResult & { newUrl?: string }> {
  return new Promise((resolve, reject) => {
    let settled = false
    let child: ChildProcess
    try {
      child = spawn(process.execPath, [cliPath, ...args], { stdio: ['ignore', 'pipe', 'pipe'], shell: false })
    } catch (error) {
      reject(error)
      return
    }
    child.unref()
    let stdout = ''
    let stderr = ''
    const finish = (result: CommandResult & { newUrl?: string }) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve(result)
      }
    }
    child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
      stdout += chunk
      const newUrl = parseSuccessorWebUrl(stdout)
      if (newUrl) finish({ code: null, stdout, stderr, newUrl })
    })
    child.stderr?.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk })
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        child.kill()
        reject(new Error('启动新的 dsh web 超时。'))
      }
    }, timeoutMs)
    timer.unref()
    child.once('error', (error) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject(new Error(`无法启动新的 dsh web：${error.message}`))
      }
    })
    child.once('close', (code) => finish({ code, stdout, stderr }))
  })
}
