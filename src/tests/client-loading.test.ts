import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

test('loading states go through the shared LoadingBody / InlineBusy components', () => {
  // 所有新增 loading 走统一构件:LoadingBody 支持默认/轻量(light)两档,
  // InlineBusy 为 af-spin-inline + 文案的组合,供按钮与行内复用。
  assert.match(client, /function LoadingBody\(\{ text, light \}\)/)
  assert.match(client, /className: "af-load" \+ \(light \? " af-load-light" : ""\)/)
  assert.match(client, /\.af-load-light \.af-skel\{display:none\}/)
  assert.match(client, /function InlineBusy\(\{ text \}\)/)
  assert.match(client, /className: "af-inline-busy", role: "status", "aria-live": "polite"/)
})

test('loading containers expose status semantics and decorative spinners are hidden', () => {
  // 容器 role=status / aria-live=polite,装饰转圈 aria-hidden,屏幕阅读器可感知。
  assert.match(client, /className: "af-load" \+ \(light \? " af-load-light" : ""\), role: "status", "aria-live": "polite"/)
  assert.match(client, /className: "af-spin", "aria-hidden": "true"/)
})

test('tool views no longer render blank while the tool call is running', () => {
  // running 期间 SearchToolView/DetailToolView 不再 return null,
  // 而是渲染带上下文的 LoadingBody;错误仍走 af-err。
  assert.match(client, /if \(running\) return h\("div", \{ className: "af-root af-tool" \},\s*\n\s*h\(LoadingBody, \{ text: query \? `正在搜索\$\{query\}…` : "正在搜索…" \}\)/)
  assert.match(client, /h\(LoadingBody, \{ text: "正在读取详情…" \}\)/)
})

test('client refetch after session restore shows loading instead of blank', () => {
  // payload 缺 items 且未报错时,二次拉取期间显示 loading,失败显示原错误文案。
  assert.match(client, /setFetching\(true\)/)
  assert.match(client, /if \(fetching\) return h\("div", \{ className: "af-root af-tool" \},/)
  assert.match(client, /if \(err\) return h\("div", \{ className: "af-root af-tool" \}, h\("div", \{ className: "af-err" \}, err\)\)/)
})

test('card pending state shows an inline spinner besides cursor:wait', () => {
  // 详情未命中缓存时,被点击卡片右上角出现行内小转圈。
  assert.match(client, /pendingId === item\.id \? h\("span", \{ className: "af-card-busy" \},/)
  assert.match(client, /\.af-card-busy\{position:absolute/)
})

test('stream config failure is visible with a retry instead of spinning forever', () => {
  // config 读取失败时 configError 先于 !config 的 loading 分支命中,
  // 显示错误与「重试」;重试重新进入 loading。
  assert.match(client, /const \[configError, setConfigError\] = useState\(false\)/)
  assert.match(client, /if \(configError\) return h\("div", \{ className: "af-stream-empty", role: "alert" \},/)
  assert.match(client, /"data-testid": "stream-config-retry", onClick: retryConfig/)
  assert.match(client, /const retryConfig = \(\) => \{/)
})

test('streamResolve shows a busy placeholder and blocks repeat clicks', () => {
  // 解析期间播放器区域显示「正在解析播放地址…」,上一集/下一集/选集/换源禁用;
  // 连续切集用序号忽略过期响应。
  assert.match(client, /"正在解析播放地址…"/)
  assert.match(client, /const \[resolving, setResolving\] = useState\(false\)/)
  assert.match(client, /if \(resolving\) return; \/\/ 解析期间防重复点击/)
  assert.match(client, /const seq = \+\+resolveSeqRef\.current/)
  assert.match(client, /if \(seq !== resolveSeqRef\.current\) return;/)
  assert.match(client, /disabled: !previousEpisode \|\| resolving/)
  assert.match(client, /disabled: !nextEpisode \|\| resolving/)
  assert.match(client, /"data-testid": "stream-episode"[^}]*disabled: resolving/)
  assert.match(client, /disabled: resolving, onClick: switchSource/)
})

test('player area keeps a buffering mask over the video element', () => {
  // video 外层容器加遮罩层,pointer-events:none 保留原生控制条;
  // 未就绪显示「正在缓冲视频…」,error 后遮罩退出。
  assert.match(client, /\.af-video-wrap\{position:relative/)
  assert.match(client, /\.af-video-mask\{[^}]*pointer-events:none/)
  assert.match(client, /"正在缓冲视频…"/)
  assert.match(client, /currentUrl && !videoReady && !playError/)
  assert.match(client, /onCanPlay: \(\) => setVideoReady\(true\)/)
})

test('settings panel shows first-read loading and load failure retry', () => {
  // 首次读取配置期间显示「正在读取设置…」且不渲染可编辑表单;
  // 读取失败显示错误+重试,重试重新进入 loading。
  assert.match(client, /const \[loading, setLoading\] = useState\(true\)/)
  assert.match(client, /h\(LoadingBody, \{ text: "正在读取设置…" \}\)/)
  assert.match(client, /"data-testid": "config-load-retry", onClick: retryLoad/)
  assert.match(client, /const retryLoad = \(\) => \{/)
})

test('save button shows inline spinner text and locks the form while saving', () => {
  // 保存按钮文案「保存中…」+行内转圈;保存期间表单区 aria-busy 且输入禁用。
  assert.match(client, /saving \? h\(InlineBusy, \{ text: "保存中…" \}\) : "保存"/)
  assert.match(client, /className: "af-cfg-b", "aria-busy": saving \? "true" : undefined/)
  assert.match(client, /\.af-cfg-b\[aria-busy="true"\] \.af-cfg-f input/)
})

test('update checking status carries an inline spinner', () => {
  // checking 状态盒内补 af-spin-inline,按钮文案维持「检查中…」。
  assert.match(client, /checking \? "检查中…" : "检查更新"/)
  assert.match(client, /"正在查询 GitHub 正式 Release…"/)
})

test('dead .af-meta-loading rule is removed', () => {
  assert.doesNotMatch(client, /af-meta-loading/)
})

test('images use the shared CoverImg skeleton instead of blank placeholders', () => {
  // 封面/头像等图片下载期间不再留白:统一 CoverImg 构件,
  // shimmer 扫光骨架 → load 淡入(af-img-ok)→ error 占位符。
  assert.match(client, /function CoverImg\(\{ className, src, alt, style, fallback \}\)/)
  assert.match(client, /onLoad: \(\) => setState\("ok"\)/)
  assert.match(client, /onError: \(\) => setState\("error"\)/)
  assert.match(client, /className: "af-img-fb", "aria-hidden": "true"/)
  assert.match(client, /h\(CoverImg, \{ className: "af-cover", src: coverSrc\(item\.cover, item\.title\) \}\)/)
  assert.match(client, /h\(CoverImg, \{ className: "af-dcover"/)
  assert.match(client, /h\(CoverImg, \{\s*\n\s*className: "af-avatar"/)
  assert.match(client, /\.af-imgbox\{display:block;position:relative;overflow:hidden/)
  assert.match(client, /@keyframes af-img-shimmer/)
  assert.match(client, /\.af-imgbox\.af-img-ok img\{opacity:1\}/)
  assert.match(client, /\.af-imgbox\.af-img-ok::after,\.af-imgbox\.af-img-err::after\{display:none\}/)
})
