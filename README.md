# anime-find

![anime-find](docs/banner.jpg)

[![CI](https://github.com/cocofhu/anime-find/actions/workflows/ci.yml/badge.svg)](https://github.com/cocofhu/anime-find/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@cocofhu/anime-find.svg)](https://www.npmjs.com/package/@cocofhu/anime-find)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

DeepSeek Harness 搜番插件。在对话中搜索番剧，以可点击卡片展示结果，并在详情面板中查看字幕组、磁力链接和种子文件。

## 功能

- 聚合 [Mikan](https://mikanani.me)、[AniBT](https://anibt.net) 和 [AnimeGarden](https://animes.garden)
- 在对话流中展示番剧封面、标题、评分、格式和资源数量
- 根据 Asia/Shanghai 时区识别当前新番季度
- 支持「还有吗」「换一批」等追问并分页展示更多结果
- 点击卡片后按字幕组和集数浏览资源，并可查看 Bangumi 介绍、评分和短评
- 支持复制磁力链接和打开 `.torrent` 文件
- 可选流媒体 Tab：按搜索结果显示用户规则解析出的可播源，并在同页选集播放
- 可在 Harness 插件设置中启用来源、调整结果数量和站点地址
- 在插件设置中查看当前版本，并手动检查 GitHub 正式 Release

## 环境要求

- Node.js 22 或更高版本
- DeepSeek Harness Web

## 安装

从 [npm](https://www.npmjs.com/package/@cocofhu/anime-find) 安装：

```sh
dsh plugin --profile web add @cocofhu/anime-find
```

本地开发：

```sh
dsh plugin --profile web add /absolute/path/to/anime-find
```

安装后重启 `dsh web`，并强制刷新浏览器页面。不要用 `github:cocofhu/anime-find` 或无前缀的 `anime-find` 安装：git 源会跑 `prepare`；旧包名已迁到 `@cocofhu/anime-find`。

## 使用

可以直接对 Agent 说：

> 搜一下无职转生，看看有没有磁力

> 最近有哪些好看的动漫

> 还有吗

插件向 Agent 提供 `anime_find_search` 工具。搜索完成后，对话中会显示可点击卡片；点击卡片即可查看字幕组与下载资源。

### 资源详情

按字幕组浏览集数、复制磁力链接或打开种子文件：

![资源详情：无职转生第三季的磁力与种子列表](docs/screenshot-resources.png)

### 流媒体播放

在详情中切换到流媒体，选择剧集后可在对话中直接播放：

![流媒体播放：无职转生第三季在线播放](docs/screenshot-streaming.png)

## 配置

打开 **设置 → 插件 → 插件配置 → 搜番**：

- **搜索源**：默认仅启用 Mikan，可选 AniBT 和 AnimeGarden
- **搜索结果上限**：每批返回的卡片数量
- **站点地址**：各来源的服务地址，可按需替换镜像

保存后立即生效。配置会写入 Harness 用户目录下的 `anime-find.json`。
版本与安装来源为只读信息，不会写入该配置文件。

### 流媒体播放

流媒体默认开启，并内置一条可静态解析的试点规则（xfdm）。打开 **设置 → 插件 → 插件配置 → 搜番**
可关闭总开关、启停或替换规则 JSON。规则须为可静态解析的 CSS 或受限 XPath 子集，至少包含
`name`、`baseURL`、`searchURL`、`searchList`、`searchName`、`searchResult`、`chapterRoads`
和 `chapterResult`。`{{keyword}}` 或 `{{query}}` 会替换为搜索关键词。

播放地址支持两种取法：`playURL` 既可以是指向 `src`/`href` 的选择器，也可以写成
`script:player_aaaa.url`，从播放页内联脚本对象里读取（MacCMS 站点常用，按同级
`encrypt` 字段自动处理 URL 编码或 base64）。

当媒体位于站点之外的 CDN 时，用 `mediaHosts` 显式声明这些域名，只有声明过的域才会
被解析和代理放行；私网、回环和链路本地地址始终拒绝。

`mediaHeaders` 只作用于媒体请求，值留空表示不发送该头。同一站点的不同 CDN 要求可能
相反（有的必须带 `Referer`，有的带了就报错），所以键名含点时视为域名，其下的头只对该
域及其子域生效：

```json
{
  "mediaHosts": ["cdn-a.example", "cdn-b.example"],
  "mediaHeaders": { "cdn-b.example": { "referer": "" } }
}
```

流媒体 Tab 只显示已解析出剧集的源；单集不能播放时可换源或打开源站。媒体请求仅会代理到
已启用规则的域名及其声明的 `mediaHosts`（HLS playlist 会重写分片链接），不提供开放代理。首期不支持依赖
Kazumi WebView 拦截的动态规则，也不会自动同步社区规则仓库。受限 XPath 支持常见的
`//tag`、层级、序号、属性与属性包含谓词；脚本、函数和文本匹配谓词仍不支持。插件不托管任何内容，请仅
访问你有权观看的内容并遵守来源站点条款。

也可通过 `cordis.patch.yml` 设置默认来源：

```yaml
- id: anime-find
  config:
    sources: [mikan]
```

## 数据与网络

启用某个来源后，插件会向对应站点发送搜索和详情请求。封面通过插件服务转发，配置仅保存在本机，不会写入仓库。

详情卡在有 Bangumi subject ID 时，会通过 Host 使用插件配置的 User-Agent 和超时设置请求 Bangumi 条目信息；介绍、评分和基础信息来自公开 v0 API。短评由 Host 代理 Bangumi 的非公开 p1 接口，最多展示 5 条。该接口可能变更或不可用，届时短评 Tab 会自动隐藏，不影响介绍和资源浏览；本期不使用 HTML 抓取后备。

Bangumi 的介绍和短评只在用户点击详情卡后加载和渲染，不会写入提供给模型的工具正文。

请遵守来源站点的使用条款，并仅将下载能力用于你有权访问的内容。

## 版本与更新

在 **设置 → 插件 → 插件配置 → 搜番** 的「版本与更新」区块中，可手动检查
GitHub 上的最新正式 Release。打开设置页不会自动检查，也不会使用预发布版或草稿
Release。

发现新版本时，保留显示以下官方命令供参考。点击「更新」并确认后，插件会自动使用
当前 profile 执行该命令、拉起新的 `dsh web`（可能使用不同端口），然后自动跳转到新
地址：

```sh
dsh plugin --profile web update @cocofhu/anime-find
```

当前以 `link:` 或 `file:` 本地方式安装时，页面仍会显示版本对比，但禁止自动更新，
以免覆盖开发环境。若仓库尚未发布正式 Release，检查结果会显示「暂无可用 Release，无法判断是否有更新」。

## 开发

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

源码位于 `src/`，构建结果输出到 `lib/`。`lib/` 不提交到版本库，安装或发布时由 `prepare` 脚本生成。

### Harness + MiniMax 中国站验收

使用隔离的 `DSH_HOME` 部署本地插件时，需要先为 Harness 注册模型提供方；否则 Web 首次引导无法创建会话，也无法触发 `anime_find_search` 和 ToolView。密钥只通过环境变量传入，不要写入仓库或 `settings.yaml`：

```sh
export MINIMAX_KEY_CN='...'
export DSH_HOME="$(mktemp -d)"

mkdir -p "$DSH_HOME"
cat >"$DSH_HOME/settings.yaml" <<'EOF'
llm-pi-ai:
  providers:
    minimax-cn:
      apiKeyEnv: MINIMAX_KEY_CN
      api: openai-completions
      baseURL: https://api.minimaxi.com/v1
      models:
        - id: MiniMax-M3
EOF

npx @deepseek-ai/dsh web
```

随后在 **设置 → 模型** 选择 `minimax-cn / MiniMax-M3`，并从另一个终端安装本地插件：

```sh
DSH_HOME="$DSH_HOME" npx @deepseek-ai/dsh plugin --profile web add /absolute/path/to/anime-find
```

在新会话中请求搜番，确认工具视图的「流媒体」Tab、可播源卡片、选集和播放器路径。该配置仅用于验收；流媒体规则和任何第三方站点授权仍须由测试者自行提供。

## 故障排查

- **页面停在 Loading plugins**：确认 `pnpm build` 成功，重启 `dsh web` 后强制刷新
- **`ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`**：改用 npm 安装 `dsh plugin --profile web add @cocofhu/anime-find`，不要走 git 源或旧包名 `anime-find`
- **loader 报 `requires options.id` 或 `requires options.key`**：`settings.plugin.item` 在部分 Harness 版本是 list slot（要 `id`），在 rc7 起是 keyed slot（要 `key`）。客户端必须同时注册 `id` 和 `key`；Host 还需 `settings.register('anime-find', …)` 才能分发配置卡
- **搜番卡片未出现**：开启新对话，并确认 `anime_find_search` 已加载
- **本季结果较少**：提高结果上限，或在设置中启用 AniBT / AnimeGarden
- **来源请求失败**：检查网络与对应站点地址；单个来源失败不会阻止其他来源返回结果

## 参与贡献

提交 Issue 或 Pull Request 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。

## 许可证

[MIT](LICENSE)
