# Neco

Neco 是 NMO Ecosystem 的前端项目，用于展示服务器列表、活动/新闻内容、文档内容，并提供面向管理员的内容管理后台。项目整体采用 Vue 3 + TypeScript + Vite 构建，界面风格以 Minecraft 像素风为主，并尽量保持键盘导航与屏幕阅读器可用。

后端项目为 [`necore`](../necore)，前端默认通过 `/necore` 前缀访问后端 API。

## 功能概览

### 公开页面

- **大厅页**：展示社团/站点入口与介绍内容。
- **服务器列表**：展示服务器名称、图标、描述、在线地图链接与实时状态。
  - 支持同步 Minecraft 服务器状态。
  - 支持展示在线人数、容量、版本、延迟与服务器图标。
  - 对同步成功且返回玩家样本的服务器，支持展开在线玩家头像列表。
  - 玩家列表默认一排展示；一排放不下时自动变成两排；两排仍放不下时横向滚动。
  - 玩家头像可通过鼠标悬停或 Tab 聚焦查看名称。
- **活动页/新闻页**：展示文章列表、置顶文章、活动时间与文章详情。
- **文档页**：展示公开文档树与文档内容。
- **关于页**：展示外部链接与相关信息。

### 管理后台

管理后台入口为：

```text
/management
```

已包含以下管理模块：

- **用户管理**：创建用户、修改权限、修改标签、删除用户。
- **社团管理**：维护首页/社团相关展示内容。
- **服务器管理**：维护服务器名称、图标、描述、地图地址、实时同步配置。
- **文章管理**：创建、编辑、上传附件、删除文章。
  - 保存文章时会弹出 Dialog，允许管理员选择是否推送更新到在线 WebSocket Bot。
  - 支持选择一个或多个 Bot 连接进行定向推送。
- **文档管理**：管理文档树、文件夹、公开/私有文档内容与附件。
- **机器人连接管理**：管理 Bot Token、查看在线连接、查看连接日志、踢出异常连接。

### 权限组

前端会根据登录用户的 `group` 字段决定后台能力。当前主要权限包括：

| 权限组 | 用途 |
|---|---|
| `admin` | 超级管理员，拥有全部管理权限 |
| `news_admin` | 文章/新闻管理 |
| `server_admin` | 服务器列表管理 |
| `document_admin` | 文档管理 |
| `bot_admin` | Bot Token 与 WebSocket 连接管理 |

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Axios
- md-editor-v3
- vue-toastification
- vue-clipboard3
- mitt

## 项目结构

```text
.
├── API.md                         # 前后端 API 约定文档
├── index.html
├── package.json
├── vite.config.ts
└── src
    ├── api                        # API 封装
    │   ├── api.ts                 # axios 实例
    │   ├── auth.ts                # 登录、用户、权限相关接口
    │   ├── bot.ts                 # Bot Token 与 WebSocket 状态接口
    │   ├── documents.ts           # 文档接口
    │   ├── newslist.ts            # 文章接口
    │   └── serverlist.ts          # 服务器列表与状态接口
    ├── components                 # 通用组件
    │   ├── utils                  # Minecraft 风格按钮、输入框、Dialog 等
    │   └── icons
    ├── eventbus                   # 全局事件总线
    ├── router                     # 路由定义
    ├── theme-override             # 第三方组件主题覆盖
    └── views                      # 页面
        ├── Activity
        ├── Auth
        ├── Documents
        ├── List
        ├── Lobby
        ├── Management
        └── News
```

## 环境要求

建议使用：

- Node.js 22+
- npm 11+

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

类型检查与构建：

```bash
npm run type-check
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

代码格式化与检查：

```bash
npm run format
npm run lint
```

## 后端地址配置

前端 API 封装位于：

```text
src/api/api.ts
```

通常需要确保 axios 的 baseURL 指向 necore 的 `/necore` 前缀，例如：

```text
http://localhost:3000/necore
```

如果前端和后端同源部署，可以通过反向代理把 `/necore` 转发给后端。

## 服务器实时状态与玩家头像

服务器实时状态由后端接口提供：

```text
POST /necore/server/status
```

前端会在服务器条目 `realtime === true` 时请求该接口。如果返回 `online: true`，前端会展示在线人数、容量、版本等信息。

当后端返回 `players` 列表时，前端会在服务器卡片下方提供可展开的玩家头像列表。头像获取策略为：

1. 优先使用 UUID 请求头像；
2. 没有 UUID 时使用玩家名请求头像；
3. 多个头像源按顺序兜底；
4. 最终回退到默认 Steve 头像。

注意：Minecraft 状态协议中的玩家列表通常是 sample，不保证包含全部在线玩家。部分服务器也可能隐藏 sample。

## Bot 管理与文章推送

机器人连接管理页面用于维护 necore 的 `/bots` WebSocket 连接。

主要能力：

- 创建 Bot Token；
- 查看 Token 列表；
- 删除 Token；
- 查看在线 Bot 连接；
- 踢出指定连接；
- 查看后端连接日志。

文章管理页在保存文章时会弹出推送选择 Dialog：

- 选择“不推送”：只保存文章；
- 选择“保存并推送”：保存文章，并将 `article_updated` 事件推送到选中的 WebSocket 连接；
- 选择“取消”：不保存。

推送依赖后端支持：

```json
{
  "doesNotify": true,
  "notifySessionIds": ["session-id-1", "session-id-2"]
}
```

## 无障碍设计约定

项目中的管理页与交互组件应尽量满足以下要求：

- 可点击元素使用 `button` 或提供明确的键盘交互。
- 图标按钮提供 `aria-label`。
- Dialog 使用明确标题，并保证确认/取消操作可通过键盘完成。
- 动态状态变化使用 `aria-live` 提示。
- 列表、表格、日志等区域使用合适的 `role`、`caption` 或 `aria-label`。
- 服务器玩家头像支持 Tab 聚焦，并在聚焦时显示玩家名称。

## 部署建议

### 同源部署

推荐使用同一域名部署前端和后端：

```text
https://example.com/          -> neco 静态资源
https://example.com/necore/   -> necore API
```

Nginx 示例：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /necore/ {
    proxy_pass http://127.0.0.1:3000/necore/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /necore/bots/ws/ {
    proxy_pass http://127.0.0.1:3000/necore/bots/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### 构建产物

```bash
npm run build
```

构建结果位于：

```text
dist/
```

## 开发注意事项

- 新增 API 时优先在 `src/api/` 中封装，页面组件不要直接拼装 axios 请求。
- 新增后台页面时同步修改 `src/router/index.ts` 和 `ManagementView.vue` 的导航入口。
- 涉及权限展示时同步更新 `UserManagementView.vue` 中的权限名称映射与编辑开关。
- 文件上传接口返回的 `/contents/...` 路径不一定包含 `/necore` 前缀，前端展示资源时需要统一处理。
- 对后端返回的日志 HTML 片段必须做白名单清理，避免直接渲染不可信 HTML。

## 常用命令

```bash
# 安装依赖
npm install

# 开发
npm run dev

# 类型检查
npm run type-check

# 构建
npm run build

# 预览
npm run preview

# 自动格式化
npm run format

# ESLint 修复
npm run lint
```
