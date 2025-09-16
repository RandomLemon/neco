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

User group includes ["admin", "news_admin"]. If empty, the user doesn"t have permission to manage corresponding resources.

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
        "tags": [{
            "text": "string",
            "color": "string",
            "tagColor": "string",
        }, ...]
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

#### User Avatar

- auth

Any user

- request

`GET /auth/avatar/:id`

- response

```json
{
    "avatar": "string"
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
        "tags": [{
            "text": "string",
            "color": "string",
            "tagColor": "string",
        }, ...]
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
            "tags": [{
                "text": "string",
                "color": "string",
                "tagColor": "string",
            }, ...]
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
    "self_password": "string",
    "new_password": "string",
}
```

#### Update Avatar

- auth

User can update their own avatar.

- request

`POST /auth/avatar`

```json
{
    "username": "string",
    "avatar": "string"
}
```

- response

```json
{
    "error": "string" // if error
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

Admin can change group and tag of others.

- request

`PATCH /auth/user`

```json
{
    "username": "string",
    "group": "string[]",
    "tags": [{
        "text": "string",
        "color": "string",
        "tagColor": "string",
    }, ...]
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

### About Link

#### Get Link List

- request

`GET /link`

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

#### Add Link

- auth

Admin

- request

`POST /link`

```json
{
    "name": "string",
    "image": "string",
    "url": "string",
    "description": "string"
}
```

- response

```json
{
    "error": "string" // if error
}
```

#### Update Link

- auth

Admin

- request

`PATCH /link`

```json
{
    "name": "string",
    "image": "string",
    "url": "string",
    "description": "string"
}
```

- response

```json
{
    "error": "string" // if error
}
```

#### Delete Link

- auth

Admin

- request

`DELETE /link/:id`

- response

```json
{
    "error": "string" // if error
}
```

### Server

#### Get Server List

- request

`GET /server`

- response

```json
{
    "servers":
    [
        {
            
            "name": "string",
            "icon": "string",
            "description": "string",
            // If realtime is true, the following fields will be valid.
            "realtime": "boolean", 
            "online": "boolean",
            "playerCount": "number",
            "capacity": "number",
            "onlineMapUrl": "string",
            "serverUrl": "string",
        },
        ...
    ]
}
```

#### Add Server

- auth

Admin

- request

`POST /server`

```json
{
    "name": "string",
    "icon": "string",
    "description": "string",
    "realtime": "boolean",
    "online": "boolean",
    "playerCount": "number",
    "capacity": "number",
    "onlineMapUrl": "string",
    "serverUrl": "string",
}
```

- response

```json
{
    "error": "string" // if error
}
```

#### Update Server

- auth

Admin

- request

`PATCH /server`

```json
{
    "name": "string",
    "icon": "string",
    "description": "string",
    "realtime": "boolean",
    "online": "boolean",
    "playerCount": "number",
    "capacity": "number",
    "onlineMapUrl": "string",
    "serverUrl": "string",
}
```

- response

```json
{
    "error": "string" // if error
}
```

#### Delete Server

- auth

Admin

- request

`DELETE /server/:id`

- response

```json
{
    "error": "string" // if error
}
```
### News

#### Get News Total

- request

`GET /news/total/:target`

target: "information" | "magazine" | "notice" | "activity" | "document",

- response

```json
{
    "total": "int"
}
```

#### Get News List

- request

`POST /news/list`

```json
{
    "target": "information" | "magazine" | "notice" | "activity" | "document",
    "page": "int",
    "page_size": "int",
    "pin": "boolean", // whether to show pinned news
}
```

- response

```json
{
    "list": [
        {
            "id": "string",
            "pin": "boolean",
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

`GET /news/detail/:id`

- response

```json
{
    "entity": {
        "pin": "boolean",
        "title": "string",
        "brief": "string",
        "date": "string",
        "endDate": "string", // Optional
        "image": "string",
    },
    "content": [
        {
            "type": "markdown" | "pdf_file",
            "content": "string", // markdown content or file url
        },
        ...
    ],
    "author": "string:username",
    "category": "information" | "magazine" | "notice" | "activity" | "document",
}
```

#### Update News

- request

`PATCH /news/:id`

```json
{
    "entity": {
        "pin": "boolean",
        "title": "string",
        "brief": "string",
        "date": "string",
        "endDate": "string", // Optional
        "image": "string",
    },
    "content": [
        {
            "type": "markdown" | "pdf_file",
            "content": "string", // markdown content or file url
        },
        ...
    ],
    "category": "information" | "magazine" | "notice" | "activity" | "document",
}
```

- response

```json
{
  "error": "string" // if error
}
```

#### Upload file resource

- request

`POST /news/upload/:id`

with multipart/form-data file upload

- response

```json
{
    "url": "string" // will be combined with backend url base, should be undefined if error
}
```

#### Remove file resouece

- request

`DELETE /news/upload/:id`

```json
{
    "url": "string" // backend url base should be removed
}
```

- response

```json
{
    "error": "string" // if error
}
```

#### Create News

- request

`POST /news/create`

创建一个空的新闻，返回其ID，编辑通过update来实现

- response

```json
{
    "id": "string",
    "error": "string" // if error
}
```

#### Delete News

- request

`DELETE /news/:id`

- response

```json
{
    "error": "string" // if error
}
```

### TODO