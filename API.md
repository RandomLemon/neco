# Necore API 约定文档

## 1. 基础约定

### 1.1 Base URL

开发默认端口来自 `.env` 的 `PORT`，默认值为 `3000`。

```text
http://localhost:3000/necore
```

前端建议配置：

```ts
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/necore'
```

### 1.2 内容类型

| 场景 | Content-Type |
|---|---|
| 普通请求 | `application/json` |
| 文件上传 | `multipart/form-data`，字段名固定为 `file` |
| 静态资源访问 | 直接 GET URL |
| Bot WebSocket | `Upgrade: websocket` |

### 1.3 鉴权方式

需要登录的接口使用 JWT Bearer Token：

```http
Authorization: Bearer <jwt>
```

JWT 由 `POST /necore/auth/login` 返回。JWT 载荷包含：

```json
{
  "name": "用户名",
  "ver": 1,
  "iat": 1710000000,
  "exp": 1710259200
}
```

当前源码中 JWT 有效期为 **72 小时**。以下操作会使目标用户旧 token 失效：

- 修改密码：`POST /auth/password`
- 管理员修改用户权限/标签：`PATCH /auth/user`
- 删除用户：`DELETE /auth/user/:id`

### 1.4 用户组/权限组

| 权限组 | 用途 |
|---|---|
| `admin` | 超级管理员，拥有大多数管理权限 |
| `news_admin` | 新闻/文章管理 |
| `server_admin` | 服务器条目管理 |
| `document_admin` | 文档管理 |
| `bot_admin` | Bot Token 与连接踢出管理 |

### 1.5 通用错误响应

项目没有统一响应包装。多数错误返回 JSON：

```json
{
  "error": "错误信息"
}
```

部分接口还会带 `err` 字段：

```json
{
  "error": "Internal Server Error",
  "err": {}
}
```

前端建议只强依赖 HTTP 状态码与 `error` 字段，不强依赖 `err`。

### 1.6 常见 HTTP 状态码

| 状态码 | 含义 |
|---:|---|
| 200 | 成功。部分接口返回 JSON，部分接口仅返回纯文本 `OK` |
| 201 | 创建成功。目前 Bot Token 创建接口使用 201 |
| 204 | 成功且无响应体。文件删除接口使用 204 |
| 400 | 请求体格式错误、文件名非法、参数非法 |
| 401 | 未登录、token 无效、token 被撤销、账号密码错误 |
| 403 | 已登录但权限不足 |
| 404 | 资源不存在。部分接口不存在时可能返回 500 |
| 429 | 登录过于频繁或服务器状态查询繁忙 |
| 500 | 后端内部错误；`/server/status` 在服务器离线时也会返回 500 + `online:false` |

### 1.7 静态资源 URL 约定

后端静态资源路由：

```text
GET /necore/contents/{objectId}/{filename}
```

上传接口实际返回的 URL 形如：

```json
{
  "url": "/contents/{objectId}/{filename}"
}
```

由于返回值 **不包含 `/necore` 前缀**，前端访问时建议统一转换：

```ts
function toAssetUrl(url: string) {
  if (url.startsWith('/contents/')) return `${API_ORIGIN}/necore${url}`
  return url
}
```

允许上传的文件后缀：

```text
.png, .jpg, .jpeg, .webp, .pdf, .txt
```

文件保存后会被重命名为 UUID 文件名，不能假设原始文件名会保留。

---

## 2. TypeScript 数据模型建议

```ts
export type UserGroup =
  | 'admin'
  | 'news_admin'
  | 'server_admin'
  | 'document_admin'
  | 'bot_admin'
  | string

export interface UserTag {
  text: string
  color: string
  tagColor: string
}

export interface UserInfo {
  username: string
  group: UserGroup[]
  tags: UserTag[]
}

export type ArticleCategory =
  | 'information'
  | 'magazine'
  | 'notice'
  | 'activity'
  | 'document'
  | string

export type ContentBlockType = 'markdown' | 'pdf_file' | 'image' | string

export interface ContentBlock {
  type: ContentBlockType
  content: string
}

export interface ArticleEntity {
  id?: string
  pin: boolean
  title: string
  brief: string
  date: string
  endDate: string
  image: string
}

export interface ArticleDetail {
  entity: Omit<ArticleEntity, 'id'>
  content: ContentBlock[]
  category: ArticleCategory
  author: string
}

export interface ServerItem {
  id: string
  name: string
  icon: string
  description: string
  onlineMapUrl: string
  realtime: boolean
  serverUrl: string
}

export interface ServerStatus {
  online: boolean
  icon: string
  playerCount: number
  capacity: number
  latency: number
  version: string
}

export interface DocumentNode {
  parentId: string
  id: string
  isFolder: boolean
  private: boolean
  name: string
}

export interface DocumentNodeWithContent extends DocumentNode {
  contributors: string[]
  content: ContentBlock[]
  updateTime: string
}

export interface BotConnection {
  session_id: string
  identifier: string
  token_id: number
  token_name: string
  connected: string
}

export interface BotDashboardStatus {
  online_count: number
  connections: BotConnection[]
  logs: string[] // 后端返回 HTML 片段字符串；前端渲染时注意 XSS 策略
}
```

---

## 3. 接口总览

| 模块 | 方法 | 路径 | 登录 | 权限 | 说明 |
|---|---|---|---|---|---|
| 基础 | GET | `/slogan` | 否 | - | 获取随机标语 |
| 认证/用户 | POST | `/auth/login` | 否 | - | 登录 |
| 认证/用户 | GET | `/auth/status` | 是 | 任意登录用户 | 校验 token 是否有效 |
| 认证/用户 | POST | `/auth/register` | 是 | `admin` | 创建用户 |
| 认证/用户 | GET | `/auth/user/:id` | 否 | - | 获取用户公开信息 |
| 认证/用户 | GET | `/auth/avatar/:id` | 否 | - | 获取用户头像 |
| 认证/用户 | GET | `/auth/userlist` | 是 | 任意登录用户 | 获取用户列表 |
| 认证/用户 | DELETE | `/auth/user/:id` | 是 | `admin` | 删除用户 |
| 认证/用户 | POST | `/auth/password` | 是 | `admin` 或本人 | 修改密码 |
| 认证/用户 | POST | `/auth/avatar` | 是 | `admin` 或本人 | 修改头像 |
| 认证/用户 | PATCH | `/auth/user` | 是 | `admin` | 修改用户权限/标签 |
| 新闻 | GET | `/news/total/:target` | 否 | - | 按分类统计文章数量 |
| 新闻 | POST | `/news/list` | 否 | - | 文章列表分页 |
| 新闻 | GET | `/news/detail/:id` | 否 | - | 文章详情 |
| 新闻 | POST | `/news/create` | 是 | `admin`/`news_admin` | 创建空文章并返回 ID |
| 新闻 | PATCH | `/news/:id` | 是 | `admin`/`news_admin` | 更新文章 |
| 新闻 | POST | `/news/upload/:id` | 是 | `admin`/`news_admin` | 上传文章附件 |
| 新闻 | DELETE | `/news/upload/:id` | 是 | `admin`/`news_admin` | 删除文章附件 |
| 新闻 | DELETE | `/news/:id` | 是 | `admin`/`news_admin` | 删除文章 |
| 服务器 | GET | `/server/` | 否 | - | 获取服务器列表 |
| 服务器 | POST | `/server/status` | 否 | - | 查询 Minecraft 服务器状态 |
| 服务器 | GET | `/server/create` | 是 | `admin`/`server_admin` | 创建空服务器条目 |
| 服务器 | PATCH | `/server/` | 是 | `admin`/`server_admin` | 更新服务器条目 |
| 服务器 | DELETE | `/server/:id` | 是 | `admin`/`server_admin` | 删除服务器条目 |
| 文档 | GET | `/documents/layer/:parentId` | 否 | - | 获取公开子节点 |
| 文档 | GET | `/documents/:id` | 否 | - | 获取公开节点内容 |
| 文档 | GET | `/documents/layer/private/:parentId` | 是 | `admin`/`document_admin` | 获取全部子节点，含私有 |
| 文档 | GET | `/documents/private/:id` | 是 | `admin`/`document_admin` | 获取节点内容，含私有 |
| 文档 | POST | `/documents/node` | 是 | `admin`/`document_admin` | 创建文档节点 |
| 文档 | POST | `/documents/node/:id` | 是 | `admin`/`document_admin` | 移动节点/修改父节点 |
| 文档 | PUT | `/documents/node/:id` | 是 | `admin`/`document_admin` | 更新节点内容与私有状态 |
| 文档 | PATCH | `/documents/node/:id` | 是 | `admin`/`document_admin` | 重命名节点 |
| 文档 | DELETE | `/documents/node/:id` | 是 | `admin`/`document_admin` | 删除节点，文件夹会递归删除 |
| 文档 | POST | `/documents/upload/:id` | 是 | `admin`/`document_admin` | 上传文档附件 |
| 文档 | DELETE | `/documents/upload/:id` | 是 | `admin`/`document_admin` | 删除文档附件 |
| 静态资源 | GET | `/contents/{id}/{filename}` | 否 | - | 获取上传文件 |
| Bot | POST | `/bots/token` | 是 | `admin`/`bot_admin` | 创建 Bot Token 记录 |
| Bot | GET | `/bots/token` | 是 | `admin`/`bot_admin` | 获取 Bot Token 列表 |
| Bot | GET | `/bots/token/:id` | 是 | `admin`/`bot_admin` | 按名称获取 Bot Token |
| Bot | DELETE | `/bots/token/:id` | 是 | `admin`/`bot_admin` | 按名称删除 Bot Token |
| Bot | GET | `/bots/status` | 是 | 任意登录用户 | 获取 Bot 连接面板状态 |
| Bot | DELETE | `/bots/ws/kick/:session_id` | 是 | `admin`/`bot_admin` | 踢出 Bot 连接 |
| Bot WS | GET | `/bots/ws/updates` | Bot Token | Bot Token | Bot WebSocket 连接 |

---

## 4. 基础接口

### 4.1 获取随机标语

```http
GET /necore/slogan
```

无需登录。

响应：

```json
{
  "slogan": "煤炭 (Coal) 出自《Minecraft》..."
}
```

---

## 5. 认证与用户接口

### 5.1 登录

```http
POST /necore/auth/login
Content-Type: application/json
```

无需登录。登录接口有频率限制：**每分钟最多 8 次**，超限返回 429。

请求体：

```json
{
  "username": "admin",
  "password": "password"
}
```

成功响应：

```json
{
  "token": "jwt-token",
  "user": {
    "username": "admin",
    "group": ["admin"],
    "tags": [
      {
        "text": "站长",
        "color": "#ffffff",
        "tagColor": "#409EFF"
      }
    ]
  }
}
```

错误：

| 状态码 | 场景 |
|---:|---|
| 400 | JSON 格式错误 |
| 401 | 用户名或密码错误 |
| 429 | 登录请求过于频繁 |
| 500 | 数据库或 token 生成错误 |

### 5.2 检查登录状态

```http
GET /necore/auth/status
Authorization: Bearer <jwt>
```

成功响应：

```json
{
  "status": "alive"
}
```

如果 token 过期、无效或被撤销，返回 401。

### 5.3 创建用户

```http
POST /necore/auth/register
Authorization: Bearer <admin-jwt>
Content-Type: application/json
```

权限：`admin`。

请求体：

```json
{
  "username": "new-user",
  "password": "initial-password"
}
```

成功响应：

```json
{}
```

### 5.4 获取用户公开信息

```http
GET /necore/auth/user/{username}
```

无需登录。

成功响应：

```json
{
  "user": {
    "username": "alice",
    "group": ["document_admin"],
    "tags": []
  }
}
```

用户不存在返回：

```json
{
  "error": "User not found"
}
```

状态码为 404。

### 5.5 获取用户头像

```http
GET /necore/auth/avatar/{username}
```

无需登录。

成功响应：

```json
{
  "avatar": "https://example.com/avatar.png"
}
```

如果用户不存在，当前实现可能返回空字符串：

```json
{
  "avatar": ""
}
```

### 5.6 获取用户列表

```http
GET /necore/auth/userlist
Authorization: Bearer <jwt>
```

权限：任意已登录用户。当前实现不要求 `admin`。

成功响应：

```json
{
  "users": [
    {
      "username": "admin",
      "group": ["admin"],
      "tags": []
    }
  ]
}
```

### 5.7 删除用户

```http
DELETE /necore/auth/user/{username}
Authorization: Bearer <admin-jwt>
```

权限：`admin`。

成功：状态码 200。前端只需要判断状态码，不要假设一定返回 JSON。

删除用户前会递增目标用户 `token_version`，目标用户旧 JWT 会失效。

### 5.8 修改密码

```http
POST /necore/auth/password
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或本人。

请求体：

```json
{
  "id": "alice",
  "self_password": "old-password",
  "new_password": "new-password"
}
```

注意：当前实现即使调用者是 `admin`，也会校验 `self_password` 是否为目标用户当前密码。因此前端管理后台如果要做“管理员重置密码”，当前后端接口并不直接支持无旧密码重置。

成功：状态码 200。目标用户旧 JWT 会失效。

错误：

| 状态码 | 场景 |
|---:|---|
| 400 | 请求体错误 |
| 401 | 旧密码错误 |
| 403 | 非 admin 且不是本人 |
| 500 | 数据库错误 |

### 5.9 修改头像

```http
POST /necore/auth/avatar
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或本人。

请求体：

```json
{
  "username": "alice",
  "avatar": "https://example.com/avatar.png"
}
```

成功：状态码 200。修改头像不会使 JWT 失效。

### 5.10 修改用户权限/标签

```http
PATCH /necore/auth/user
Authorization: Bearer <admin-jwt>
Content-Type: application/json
```

权限：`admin`。

请求体：

```json
{
  "username": "alice",
  "group": ["document_admin"],
  "Tags": [
    {
      "text": "文档维护",
      "color": "#ffffff",
      "tagColor": "#67C23A"
    }
  ]
}
```

注意：当前后端字段名是大写 `Tags`，不是 `tags`。前端必须按源码发送 `Tags`，否则标签会解析为空。

成功：状态码 200。目标用户旧 JWT 会失效。

---

## 6. 新闻/文章接口

### 6.1 文章分类

源码注释给出的分类：

```ts
'information' | 'magazine' | 'notice' | 'activity' | 'document'
```

后端当前没有枚举校验，传入其他字符串也会作为分类查询或保存。

### 6.2 获取分类文章总数

```http
GET /necore/news/total/{target}
```

无需登录。

路径参数：

| 参数 | 类型 | 说明 |
|---|---|---|
| `target` | string | 分类名，例如 `notice` |

成功响应：

```json
{
  "total": 12
}
```

### 6.3 获取文章列表

```http
POST /necore/news/list
Content-Type: application/json
```

无需登录。

请求体：

```json
{
  "target": "notice",
  "page": 1,
  "page_size": 10,
  "pin": false
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `target` | string | 是 | 分类名 |
| `page` | number | 是 | 页码，从 1 开始。源码没有保护小于 1 的情况，前端应保证合法 |
| `page_size` | number | 是 | 每页数量 |
| `pin` | boolean | 是 | `true` 只查置顶；`false` 查该分类全部文章，包含置顶与非置顶 |

排序：按 `date desc` 倒序。

成功响应：

```json
{
  "list": [
    {
      "id": "uuid",
      "pin": true,
      "title": "标题",
      "brief": "摘要",
      "date": "2026-01-01",
      "endDate": "",
      "image": "/contents/uuid/file.webp"
    }
  ]
}
```

### 6.4 获取文章详情

```http
GET /necore/news/detail/{id}
```

无需登录。

成功响应：

```json
{
  "entity": {
    "pin": true,
    "title": "标题",
    "brief": "摘要",
    "date": "2026-01-01",
    "endDate": "",
    "image": "/contents/uuid/cover.webp"
  },
  "content": [
    {
      "type": "markdown",
      "content": "正文 markdown"
    }
  ],
  "category": "notice",
  "author": "admin"
}
```

注意：详情响应的 `entity` 里没有 `id`，前端需要从路由或列表项保留文章 ID。

### 6.5 创建空文章

```http
POST /necore/news/create
Authorization: Bearer <jwt>
```

权限：`admin` 或 `news_admin`。

成功响应：

```json
{
  "id": "uuid"
}
```

该接口只创建一个空文章记录。随后前端应调用 `PATCH /news/:id` 写入标题、内容、分类等。

### 6.6 更新文章

```http
PATCH /necore/news/{id}
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或 `news_admin`。

请求体：

```json
{
  "entity": {
    "pin": true,
    "title": "标题",
    "brief": "摘要",
    "date": "2026-01-01",
    "endDate": "2026-02-01",
    "image": "/contents/article-id/cover.webp"
  },
  "content": [
    {
      "type": "markdown",
      "content": "正文 markdown"
    },
    {
      "type": "image",
      "content": "/contents/article-id/image.webp"
    }
  ],
  "category": "notice",
  "doesNotify": false
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `entity.pin` | boolean | 是否置顶 |
| `entity.title` | string | 标题 |
| `entity.brief` | string | 摘要 |
| `entity.date` | string | 展示日期，后端按字符串保存 |
| `entity.endDate` | string | 结束日期，后端按字符串保存，可为空 |
| `entity.image` | string | 封面图 URL |
| `content` | `ContentBlock[]` | 正文块，保存为 JSON 字符串 |
| `category` | string | 分类 |
| `doesNotify` | boolean | 为 `true` 时会通过 Bot WebSocket 广播 `article_updated` |

成功：状态码 200。

WebSocket 广播消息格式：

```json
{
  "event": "article_updated",
  "data": {
    "id": "uuid",
    "pin": true,
    "title": "标题",
    "brief": "摘要",
    "date": "2026-01-01",
    "endDate": "",
    "image": "",
    "content": "[{\"type\":\"markdown\",\"content\":\"正文\"}]",
    "author": "admin",
    "category": "notice"
  }
}
```

### 6.7 上传文章文件

```http
POST /necore/news/upload/{id}
Authorization: Bearer <jwt>
Content-Type: multipart/form-data
```

权限：`admin` 或 `news_admin`。

表单字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `file` | File | 必须，允许 `.png/.jpg/.jpeg/.webp/.pdf/.txt` |

成功响应：

```json
{
  "url": "/contents/{id}/{uuid}.txt"
}
```

### 6.8 删除文章文件

```http
DELETE /necore/news/upload/{id}
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或 `news_admin`。

请求体：

```json
{
  "filename": "uuid.txt"
}
```

成功：状态码 204，无响应体。

错误：

| 状态码 | 场景 |
|---:|---|
| 400 | 请求体错误或文件名非法 |
| 404 | 文件不存在 |
| 500 | 文件删除失败 |

### 6.9 删除文章

```http
DELETE /necore/news/{id}
Authorization: Bearer <jwt>
```

权限：`admin` 或 `news_admin`。

成功：状态码 200。

删除文章会同时删除 `./contents/{id}` 文件夹。

---

## 7. 服务器接口

### 7.1 获取服务器列表

```http
GET /necore/server/
```

无需登录。

成功响应：

```json
{
  "servers": [
    {
      "id": "uuid",
      "name": "生存服",
      "icon": "/contents/server-id/icon.webp",
      "description": "服务器介绍",
      "onlineMapUrl": "https://map.example.com",
      "realtime": true,
      "serverUrl": "mc.example.com:25565"
    }
  ]
}
```

### 7.2 查询 Minecraft 服务器状态

```http
POST /necore/server/status
Content-Type: application/json
```

无需登录。

请求体：

```json
{
  "serverUrl": "mc.example.com:25565"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `serverUrl` | string | 域名或 `域名:端口`；没有端口时默认 25565 |

成功在线响应，状态码 200：

```json
{
  "online": true,
  "icon": "data:image/png;base64,...",
  "playerCount": 10,
  "capacity": 100,
  "latency": 35,
  "version": "1.20.1"
}
```

服务器离线或查询失败时，当前实现返回状态码 500，但响应体仍是状态结构：

```json
{
  "online": false,
  "icon": "",
  "playerCount": 0,
  "capacity": 0,
  "latency": 0,
  "version": ""
}
```

前端建议：对该接口单独处理，收到 500 且 body 可解析为 `ServerStatus` 时，可当作“离线”展示。

并发限制：后端最多同时处理 16 个服务器状态查询，超过时返回 429：

```json
{
  "error": "Service busy"
}
```

### 7.3 创建服务器条目

```http
GET /necore/server/create
Authorization: Bearer <jwt>
```

权限：`admin` 或 `server_admin`。

成功响应：

```json
{
  "id": "uuid"
}
```

注意：该接口使用 GET 创建资源，这是当前源码实现；前端按现状调用即可，但后续可建议后端改为 POST。

### 7.4 更新服务器条目

```http
PATCH /necore/server/
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或 `server_admin`。

请求体：

```json
{
  "id": "uuid",
  "name": "生存服",
  "icon": "/contents/server-id/icon.webp",
  "description": "服务器介绍",
  "realtime": true,
  "onlineMapUrl": "https://map.example.com",
  "serverUrl": "mc.example.com:25565"
}
```

成功：状态码 200。

### 7.5 删除服务器条目

```http
DELETE /necore/server/{id}
Authorization: Bearer <jwt>
```

权限：`admin` 或 `server_admin`。

成功：状态码 200。

---

## 8. 文档接口

### 8.1 文档树模型

文档节点有两种：文件夹和文档页。

```ts
interface DocumentNode {
  parentId: string
  id: string
  isFolder: boolean
  private: boolean
  name: string
}
```

根节点使用特殊 `parentId`：

```text
root
```

创建或移动节点时：

- `parentId` 不能为空
- `parentId` 可以为 `root`
- 非 `root` 父节点必须存在
- 父节点必须是文件夹，即 `isFolder: true`
- 后端会阻止循环引用

### 8.2 获取公开子节点

```http
GET /necore/documents/layer/{parentId}
```

无需登录。只返回 `private:false` 的子节点。

成功响应：

```json
{
  "children": [
    {
      "parentId": "root",
      "id": "uuid",
      "isFolder": true,
      "private": false,
      "name": "入门指南"
    }
  ]
}
```

### 8.3 获取全部子节点，含私有

```http
GET /necore/documents/layer/private/{parentId}
Authorization: Bearer <jwt>
```

权限：`admin` 或 `document_admin`。

响应结构同公开子节点，但包含私有节点。

### 8.4 获取公开节点内容

```http
GET /necore/documents/{id}
```

无需登录。只允许读取 `private:false` 的节点。

成功响应：

```json
{
  "parentId": "root",
  "id": "uuid",
  "isFolder": false,
  "private": false,
  "name": "安装教程",
  "contributors": ["admin"],
  "content": [
    {
      "type": "markdown",
      "content": "# 安装教程"
    }
  ],
  "updateTime": "2026-June-20 12:34:56"
}
```

注意：`updateTime` 是后端自定义字符串，不是 ISO 8601。

### 8.5 获取节点内容，含私有

```http
GET /necore/documents/private/{id}
Authorization: Bearer <jwt>
```

权限：`admin` 或 `document_admin`。

响应结构同公开节点内容。

### 8.6 创建文档节点

```http
POST /necore/documents/node
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或 `document_admin`。

请求体：

```json
{
  "parentId": "root",
  "isFolder": false,
  "private": false,
  "name": "安装教程"
}
```

成功响应：

```json
{
  "id": "uuid"
}
```

创建时会把当前登录用户名加入 `contributors`。

### 8.7 移动节点/修改父节点

```http
POST /necore/documents/node/{id}
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或 `document_admin`。

请求体：

```json
{
  "parentId": "target-folder-id"
}
```

成功：状态码 200。

### 8.8 更新节点内容与私有状态

```http
PUT /necore/documents/node/{id}
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或 `document_admin`。

请求体：

```json
{
  "private": false,
  "content": [
    {
      "type": "markdown",
      "content": "# 正文"
    },
    {
      "type": "image",
      "content": "/contents/node-id/image.webp"
    }
  ]
}
```

成功：状态码 200。

更新时会：

- 覆盖 `content`
- 更新 `private`
- 将当前登录用户加入 `contributors`，并去重
- 更新 `updateTime`

### 8.9 重命名节点

```http
PATCH /necore/documents/node/{id}
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或 `document_admin`。

请求体：

```json
{
  "name": "新的名称"
}
```

成功：状态码 200。

### 8.10 删除节点

```http
DELETE /necore/documents/node/{id}
Authorization: Bearer <jwt>
```

权限：`admin` 或 `document_admin`。

成功：状态码 200。

如果删除的是文件夹，会递归删除所有子节点，并删除每个节点对应的 `./contents/{nodeId}` 文件夹。

### 8.11 上传文档文件

```http
POST /necore/documents/upload/{id}
Authorization: Bearer <jwt>
Content-Type: multipart/form-data
```

权限：`admin` 或 `document_admin`。

表单字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `file` | File | 必须，允许 `.png/.jpg/.jpeg/.webp/.pdf/.txt` |

成功响应：

```json
{
  "url": "/contents/{id}/{uuid}.txt"
}
```

### 8.12 删除文档文件

```http
DELETE /necore/documents/upload/{id}
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或 `document_admin`。

请求体：

```json
{
  "filename": "uuid.txt"
}
```

成功：状态码 204，无响应体。

---

## 9. Bot 与 WebSocket 接口

### 9.1 创建 Bot Token 记录

```http
POST /necore/bots/token
Authorization: Bearer <jwt>
Content-Type: application/json
```

权限：`admin` 或 `bot_admin`。

请求体：

```json
{
  "name": "production-bot"
}
```

名称规则：

- 长度 1 到 64
- 只能包含英文字母、数字、点号、下划线、短横线
- 正则：`^[a-zA-Z0-9._-]+$`

成功状态码：201。

当前源码响应示例：

```json
{
  "token": {
    "ID": 1,
    "CreatedAt": "2026-06-20T12:34:56Z",
    "UpdatedAt": "2026-06-20T12:34:56Z",
    "DeletedAt": null,
    "name": "production-bot"
  }
}
```

重要注意：当前实现生成了明文 bot token，但只保存 hash，且响应体的 `TokenHash` 被 `json:"-"` 隐藏，因此前端 **拿不到可复制的明文 token**。如果产品需要“创建后展示一次 bot token”，后端需要调整 `CreateBotToken` 的返回结构。

建议后端修正后的响应结构：

```json
{
  "token": "bot_xxx明文只返回一次",
  "name": "production-bot"
}
```

### 9.2 获取 Bot Token 列表

```http
GET /necore/bots/token
Authorization: Bearer <jwt>
```

权限：`admin` 或 `bot_admin`。

成功响应：

```json
{
  "tokens": [
    {
      "ID": 1,
      "CreatedAt": "2026-06-20T12:34:56Z",
      "UpdatedAt": "2026-06-20T12:34:56Z",
      "DeletedAt": null,
      "name": "production-bot"
    }
  ]
}
```

### 9.3 获取单个 Bot Token 记录

```http
GET /necore/bots/token/{name}
Authorization: Bearer <jwt>
```

权限：`admin` 或 `bot_admin`。

虽然路由参数名写作 `:id`，但 DAO 实际按 `name` 查询。

成功响应：

```json
{
  "token": {
    "ID": 1,
    "CreatedAt": "2026-06-20T12:34:56Z",
    "UpdatedAt": "2026-06-20T12:34:56Z",
    "DeletedAt": null,
    "name": "production-bot"
  }
}
```

不存在返回 404。

### 9.4 删除 Bot Token 记录

```http
DELETE /necore/bots/token/{name}
Authorization: Bearer <jwt>
```

权限：`admin` 或 `bot_admin`。

成功：状态码 200。

注意：当前删除逻辑按 `name` 删除，不检查影响行数；删除不存在的 name 也可能返回 200。

### 9.5 获取 Bot 连接状态面板

```http
GET /necore/bots/status
Authorization: Bearer <jwt>
```

权限：当前源码只要求任意已登录用户，不要求 `bot_admin`。

成功响应：

```json
{
  "online_count": 1,
  "connections": [
    {
      "session_id": "uuid",
      "identifier": "bot-1",
      "token_id": 1,
      "token_name": "production-bot",
      "connected": "2026-06-20 12:34:56"
    }
  ],
  "logs": [
    "[2026-06-20 12:34:56] <span style=\"color: #67C23A;\">SUC</span> | ..."
  ]
}
```

注意：`logs` 是 HTML 片段字符串。后端对动态文本做了转义，但前端仍应谨慎使用 `v-html`/`dangerouslySetInnerHTML`。

### 9.6 踢出 Bot 连接

```http
DELETE /necore/bots/ws/kick/{session_id}
Authorization: Bearer <jwt>
```

权限：`admin` 或 `bot_admin`。

成功：状态码 200。

### 9.7 Bot WebSocket 连接

```http
GET /necore/bots/ws/updates
Upgrade: websocket
Authorization: Bearer <bot-token>
```

用途：Bot 客户端连接到后端，接收后端广播，例如文章更新事件。

理论鉴权流程：

1. 请求必须是 WebSocket Upgrade。
2. `Authorization` 必须是 `Bearer <bot-token>`。
3. 后端对明文 bot token 做 SHA-256，与数据库保存的 token hash 比对。
4. 验证成功后注册连接。

当前实现注意点：

- 中间件读取 `c.Params("identifier")`，但路由为 `/ws/updates`，没有定义 `:identifier` 参数。
- 因此当前 `/necore/bots/ws/updates` 很可能因为 `identifier == ""` 返回 400，导致 Bot 无法正常连接。
- 建议后端修正为 `/bots/ws/updates/:identifier`，或改为读取 query：`/bots/ws/updates?identifier=bot-1`。

连接成功后，服务端可能推送：

```json
{
  "event": "article_updated",
  "data": {
    "id": "article-id",
    "title": "标题"
  }
}
```

当前服务端会读取客户端消息但不处理消息内容；客户端可保持心跳或按 WebSocket 标准关闭连接。

---

## 10. 静态资源接口

```http
GET /necore/contents/{id}/{filename}
```

无需登录。

上传后的文件都位于：

```text
./contents/{id}/{filename}
```

`id` 通常是文章 ID 或文档节点 ID。

前端渲染文件类型建议：

| 后缀 | 展示方式 |
|---|---|
| `.png/.jpg/.jpeg/.webp` | 图片 |
| `.pdf` | PDF 预览或下载 |
| `.txt` | 文本预览或下载 |

---

## 11. 前端请求封装建议

```ts
export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown) {
    super(typeof body === 'object' && body && 'error' in body ? String((body as any).error) : `HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('necore_token')
  const headers = new Headers(init.headers)

  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (res.status === 204) return undefined as T

  const contentType = res.headers.get('Content-Type') ?? ''
  const body = contentType.includes('application/json') ? await res.json() : await res.text()

  if (!res.ok) {
    throw new ApiError(res.status, body)
  }

  return body as T
}
```

文件上传示例：

```ts
export async function uploadArticleFile(articleId: string, file: File) {
  const form = new FormData()
  form.append('file', file)

  return apiRequest<{ url: string }>(`/news/upload/${articleId}`, {
    method: 'POST',
    body: form,
  })
}
```

服务器状态接口建议单独封装，因为离线时当前实现会返回 500：

```ts
export async function getServerStatus(serverUrl: string): Promise<ServerStatus> {
  try {
    return await apiRequest<ServerStatus>('/server/status', {
      method: 'POST',
      body: JSON.stringify({ serverUrl }),
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 500 && typeof err.body === 'object') {
      return err.body as ServerStatus
    }
    throw err
  }
}
```
