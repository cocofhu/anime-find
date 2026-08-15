# anime-find

[![CI](https://github.com/cocofhu/anime-find/actions/workflows/ci.yml/badge.svg)](https://github.com/cocofhu/anime-find/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

DeepSeek Harness 搜番插件。在对话中搜索番剧，以可点击卡片展示结果，并在详情面板中查看字幕组、磁力链接和种子文件。

## 功能

- 聚合 [Mikan](https://mikanani.me)、[AniBT](https://anibt.net) 和 [AnimeGarden](https://animes.garden)
- 在对话流中展示番剧封面、标题、评分、格式和资源数量
- 根据 Asia/Shanghai 时区识别当前新番季度
- 支持「还有吗」「换一批」等追问并分页展示更多结果
- 点击卡片后按字幕组和集数浏览资源，并可查看 Bangumi 介绍、评分和短评
- 支持复制磁力链接和打开 `.torrent` 文件
- 可在 Harness 插件设置中启用来源、调整结果数量和站点地址

## 环境要求

- Node.js 22 或更高版本
- DeepSeek Harness Web

## 安装

从 GitHub 安装：

```sh
dsh plugin --profile web add github:cocofhu/anime-find
```

本地开发安装：

```sh
dsh plugin --profile web add /absolute/path/to/anime-find
```

安装后重启 `dsh web`，并强制刷新浏览器页面。

## 使用

可以直接对 Agent 说：

> 搜一下无职转生，看看有没有磁力

> 最近有哪些好看的动漫

> 还有吗

插件向 Agent 提供 `anime_find_search` 工具。搜索完成后，对话中会显示可点击卡片；点击卡片即可查看字幕组与下载资源。

## 配置

打开 **设置 → 插件 → 插件配置 → 搜番**：

- **搜索源**：默认仅启用 Mikan，可选 AniBT 和 AnimeGarden
- **搜索结果上限**：每批返回的卡片数量
- **站点地址**：各来源的服务地址，可按需替换镜像

保存后立即生效。配置会写入 Harness 用户目录下的 `anime-find.json`。

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

## 开发

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

源码位于 `src/`，构建结果输出到 `lib/`。`lib/` 不提交到版本库，安装或发布时由 `prepare` 脚本生成。

## 故障排查

- **页面停在 Loading plugins**：确认 `pnpm build` 成功，重启 `dsh web` 后强制刷新
- **搜番卡片未出现**：开启新对话，并确认 `anime_find_search` 已加载
- **本季结果较少**：提高结果上限，或在设置中启用 AniBT / AnimeGarden
- **来源请求失败**：检查网络与对应站点地址；单个来源失败不会阻止其他来源返回结果

## 参与贡献

提交 Issue 或 Pull Request 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。

## 许可证

[MIT](LICENSE)
