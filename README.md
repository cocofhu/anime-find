# anime-find

DeepSeek Harness 独立插件：对话里搜番，弹出卡片，点击查看字幕组与磁力。

- [Mikan](https://mikanani.me)
- [AniBT](https://anibt.net)
- [AnimeGarden](https://animes.garden)

## 安装

```sh
dsh plugin --profile web add github:cocofhu/anime-find
# 或本地路径
dsh plugin --profile web add /absolute/path/to/anime-find
```

重启 `dsh web` 后强制刷新浏览器。

## 用法

对 Agent 说：

> 搜一下无职转生，看看有没有磁力

> 最近有哪些好看的动漫

> 还有吗

Agent 会调用 `anime_find_search`，对话里出现可点击卡片。本季 / 「还有吗」会按主机时区（Asia/Shanghai）分页拉取当季新番。点击卡片查看字幕组，可复制磁力或打开种子。

## 工具

| 工具 | 作用 |
|------|------|
| `anime_find_search` | 多源搜索，返回可点击卡片；支持 `offset` 翻页 |

## 配置

**设置 → 插件 → 插件配置 → 搜番**：开关搜索源（默认仅 Mikan）、结果上限和站点地址。保存后立即生效。

也可在 `cordis.patch.yml` 里写：

```yaml
- id: anime-find
  config:
    sources: [mikan]
```

## 开发

```sh
pnpm install
pnpm test
pnpm build
```
