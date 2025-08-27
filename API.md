# API Documentation

## ROOT

`/necore`

### Slogan

- request

`GET /slogan`

- response

```json
{
    "slogan": "string"
}
```

### Auth

User group includes ["admin", "news_admin", "activity_admin"]. If empty, the user doesn't have permission to manage corresponding resources.

Auth uses JWT Token.

#### Status

`GET /auth/status`

- response

```json
{
    "status": "alive" | "dead",
}
```

#### Login

- request

`POST /auth/login`

```json
{
    "username": "string",
    "password": "string"
}
```

- response

```json
{
    "token": "string",
    "user": {
        "username": "string",
        "group": "string[]",
        "department": "string[]",
    },
    "error": "string" // if error
}
```

### Register

- auth

Only Admin can create accounts.

- request

`POST /auth/register`

```json
{
    "username": "string",
    "password": "string",
}
```

- response

```json
{
    "error": "string" // if error
}
```

#### User Info

- auth

Current user or Admin

- request

`GET /auth/user/:id`

- response

```json
{
    "user": {
        "username": "string",
        "group": "string[]",
        "department": "string[]",
    },
}
```

#### All User Info

- auth

Only Admin can see all users.

- request

`GET /auth/userlist`

- response

```json
{
    "users": [
        {
            "username": "string",
            "group": "string[]",
            "department": "string[]",
        },
    ],
}
```

#### Delete User

- auth

Only Admin can delete accounts.

- request

`DELETE /auth/user/:id`

- response

```json
{
    "error": "string" // if error
}
```

#### Update Password

- auth

User can update their own password. Admin can change password of others.

- request

`POST /auth/password`

```json
{
    "id": "string",
    "new_password": "string",
}
```

- response

```json
{
    "error": "string" // if error
}
```

#### Update User Info

- auth

Admin can change group and department of others.

- request

`PATCH /auth/user`

```json
{
    "username": "string",
    "group": "string[]",
    "department": "string[]",
}
```

- response

```json
{
    "error": "string" // if error
}
```

#### Logout

Remove session.

- request

`POST /auth/logout`

- response

```json
{
    "error": "string" // if error
}
```

### Intro

#### Get Intro List

- request

`GET /intro/list`

- response

```json
[
    {
        "title": "string",
        "description": "string",
        "image": "string"
    },
    ...
]
```

#### Get Detailed Intro List

- request

`GET /intro/detail`

- response

```json
[
    {
        "title": "string",
        "description": "string",
        "image": "string"
    },
    ...
]
```

### About Link

#### Get Link List

- request

`GET /link/list`

- response

```json
[
    {
        "name": "string",
        "image": "string",
        "url": "string",
        "description": "string"
    },
    ...
]
```

### Server

#### Get Server List

- request

`GET /server/list`

- response

```json
[
    {
        "name": "string",
        "description": "string",
        "online": "boolean",
        "playerCount": "number",
        "capacity": "number",
        "icon": "string",
        "onlineMapUrl": "string",
        "serverUrl": "string",
    },
    ...
]
```

### News

#### Get News Total

- request

`POST /news/total`

```json
{
    "target": "information" | "magazine" | "notice" | "activity",
}
```

- response

```json
{
    "total": "number"
}
```

#### Get News List

- request

`POST /news/list`

```json
{
    "target": "information" | "magazine" | "notice",
    "page": "number",
    "pageSize": 12, // 只是提醒你是 12，请求时不附带该字段！
}
```

- response

```json
{
    "list": [
        {
            "id": "string",
            "title": "string",
            "brief": "string",
            "date": "string",
            "image": "string",
        },
        ...
    ]
}
```

#### Get News Detail

- request

`POST /news/detail`

```json
{
    "id": "string"
}
```

- response

```json
{
    "entity": {
        "id": "string",
        "title": "string",
        "brief": "string",
        "date": "string",
        "image": "string",
    },
    "content": [
        {
            "type": "markdown" | "pdf_file",
            "content": "string", // markdown content or file url
        },
        ...
    ],
    "author": {
        "avatar": "string",
        "name": "string",
        "tags": [
            {
                "text": "string",
                "color": "string",
                "tagColor": "string",
            },
            ...
        ],
    },
    "category": "资讯" | "杂志" | "公告" | "活动",
}
```

### TODO