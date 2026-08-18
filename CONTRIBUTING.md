# 参与贡献

感谢你帮助改进 anime-find。Bug 修复、来源兼容、测试、文档和交互优化都欢迎提交。

## 开始之前

1. 搜索现有 Issue，避免重复报告。
2. 较大的功能或行为变更请先创建 Issue 讨论方案。
3. 安全漏洞不要公开提交 Issue，请阅读 [SECURITY.md](SECURITY.md)。
4. 不要在 Issue、日志、测试夹具或提交中包含密钥、Cookie、内网地址和个人数据。

## 本地开发

需要 Node.js 22 或更高版本，以及 pnpm。

```sh
git clone https://github.com/cocofhu/anime-find.git
cd anime-find
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

测试 Harness Web 集成时，可从本地路径安装插件：

```sh
dsh plugin --profile web add /absolute/path/to/anime-find
dsh web
```

修改 Host 或 Client 后需要重启 `dsh web`，浏览器端需要强制刷新。

## 代码约定

- 使用 TypeScript 编写 Host 逻辑；浏览器端保持无 JSX 的 `React.createElement` 风格。
- 新增来源时，实现统一的 `AnimeCard` / `AnimeDetail` 数据模型，不要把来源特有字段泄漏到通用 UI。
- 上游请求必须支持超时与取消；单个来源失败时保留其他来源结果。
- 不要把磁力列表直接输出到对话正文，详情应由用户点击卡片后按需加载。
- 修复 Bug 或新增解析规则时，应补充不依赖实时网络的测试夹具。
- 不提交 `lib/`、`node_modules/`、`.env`、日志或本地配置。

## 提交与 Pull Request

- 每个 Pull Request 聚焦一个目标，避免混入无关重构。
- 提交信息使用简短的祈使句，说明改动目的。
- 在 PR 描述中说明行为变化、测试方式和界面影响。
- UI 改动建议附截图；来源解析改动应说明对应测试。
- 提交前运行：

```sh
pnpm typecheck
pnpm test
```

提交即表示你同意以本仓库的 [MIT License](LICENSE) 授权你的贡献。

## 发布

正式版走 GitHub Release tag，并由 `.github/workflows/publish.yml` 用 npm Trusted Publishing 发到 registry。不要把 `NPM_TOKEN` 写进 workflow。

1. 升 `package.json` 的 `version`，合并进 `main`。
2. 打 annotated tag 并推送，例如 `git tag -a v0.1.6 -m "v0.1.6" && git push origin v0.1.6`。
3. 同时创建 GitHub Release；Actions 里的 Publish 会 `npm publish`。

Trusted Publisher 在 https://www.npmjs.com/package/anime-find/access 绑定一次即可：

- Organization or user：`cocofhu`
- Repository：`anime-find`
- Workflow filename：`publish.yml`
- Environment name：留空
- Allowed actions：`npm publish`

