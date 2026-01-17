# API Reference

## Authorization Server API

### Base URL
```
http://localhost:9000
```

### Endpoints

#### 1. Authorization Endpoint

認可リクエストを開始します。

```
GET /oauth2/authorize
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `response_type` | Yes | `code` (Authorization Code Flow) |
| `client_id` | Yes | クライアントID |
| `redirect_uri` | Yes | リダイレクトURI |
| `scope` | No | リクエストするスコープ（スペース区切り） |
| `state` | Yes | CSRF対策用のランダム文字列 |
| `code_challenge` | Yes (PKCE) | Code Challenge |
| `code_challenge_method` | Yes (PKCE) | `S256` または `plain` |

**Example:**
```
GET /oauth2/authorize?
  response_type=code
  &client_id=test-client
  &redirect_uri=http://localhost:3000/callback
  &scope=openid%20profile%20email%20read
  &state=abc123
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

#### 2. Token Endpoint

認可コードをトークンに交換します。

```
POST /oauth2/token
```

**Request Body (application/x-www-form-urlencoded):**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `grant_type` | Yes | `authorization_code` または `refresh_token` |
| `code` | Yes (auth_code) | 認可コード |
| `redirect_uri` | Yes (auth_code) | リダイレクトURI |
| `client_id` | Yes | クライアントID |
| `client_secret` | No | クライアントシークレット（機密クライアント） |
| `code_verifier` | Yes (PKCE) | Code Verifier |
| `refresh_token` | Yes (refresh) | リフレッシュトークン |

**Example (Authorization Code):**
```bash
curl -X POST http://localhost:9000/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=abc123" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=test-client" \
  -d "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

**Example (Refresh Token):**
```bash
curl -X POST http://localhost:9000/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=xyz789" \
  -d "client_id=test-client"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 1800,
  "refresh_token": "refresh_token_value",
  "scope": "openid profile email read"
}
```

#### 3. JWK Set Endpoint

JWT署名検証用の公開鍵を取得します。

```
GET /oauth2/jwks
```

**Response:**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "e": "AQAB",
      "kid": "key-id",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx..."
    }
  ]
}
```

#### 4. OpenID Configuration

OpenID Connect Discovery メタデータを取得します。

```
GET /.well-known/openid-configuration
```

**Response:**
```json
{
  "issuer": "http://localhost:9000",
  "authorization_endpoint": "http://localhost:9000/oauth2/authorize",
  "token_endpoint": "http://localhost:9000/oauth2/token",
  "jwks_uri": "http://localhost:9000/oauth2/jwks",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"]
}
```

---

## Resource Server API

### Base URL
```
http://localhost:8080
```

### Authentication

保護されたエンドポイントは`Authorization`ヘッダーにBearerトークンが必要です：

```
Authorization: Bearer <access_token>
```

### Endpoints

#### 1. Public Status

**認証不要**

```
GET /api/public/status
```

**Response:**
```json
{
  "status": "ok",
  "message": "Public endpoint - no authentication required",
  "timestamp": 1699999999999
}
```

#### 2. User Info

**必要なスコープ:** 認証のみ（スコープ不要）

```
GET /api/user/info
```

**Response:**
```json
{
  "username": "user",
  "authorities": [
    {
      "authority": "SCOPE_read"
    }
  ],
  "scopes": "openid profile email read",
  "claims": {
    "sub": "user",
    "aud": ["resource-server"],
    "scope": "openid profile email read",
    "iss": "http://localhost:9000",
    "exp": 1699999999,
    "iat": 1699996399
  }
}
```

#### 3. Get Messages

**必要なスコープ:** `read`

```
GET /api/messages
```

**Response:**
```json
[
  {
    "content": "Hello from OAuth2.0 Resource Server!",
    "scope": "read",
    "user": "user",
    "timestamp": 1699999999999
  },
  {
    "content": "This endpoint requires 'read' scope",
    "scope": "read",
    "user": "user",
    "timestamp": 1699999999999
  }
]
```

#### 4. Create Message

**必要なスコープ:** `write`

```
GET /api/messages/write
```

**Response:**
```json
{
  "content": "Message created successfully",
  "scope": "write",
  "user": "user",
  "timestamp": 1699999999999
}
```

#### 5. Admin Data

**必要なスコープ:** `admin`

```
GET /api/admin/data
```

**Response:**
```json
{
  "message": "This is admin-only data",
  "user": "admin",
  "scope": "admin"
}
```

**Error Response (Insufficient Scope):**
```json
{
  "error": "insufficient_scope",
  "error_description": "The request requires higher privileges than provided by the access token."
}
```

---

## Resource Owner API

### Base URL
```
http://localhost:8082
```

### Endpoints

#### 1. Get All Users

```
GET /api/users
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "pictureUrl": null,
    "provider": null,
    "providerId": null
  }
]
```

#### 2. Get User by ID

```
GET /api/users/{id}
```

**Response:**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "Test User",
  "pictureUrl": null,
  "provider": null,
  "providerId": null
}
```

#### 3. Get User by Username

```
GET /api/users/username/{username}
```

**Response:**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "Test User",
  "pictureUrl": null,
  "provider": null,
  "providerId": null
}
```

#### 4. Create User

```
POST /api/users
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "new@example.com",
  "fullName": "New User",
  "pictureUrl": "https://example.com/avatar.jpg",
  "provider": "google",
  "providerId": "123456789"
}
```

**Response:**
```json
{
  "id": 2,
  "username": "newuser",
  "email": "new@example.com",
  "fullName": "New User",
  "pictureUrl": "https://example.com/avatar.jpg",
  "provider": "google",
  "providerId": "123456789"
}
```

#### 5. Update User

```
PUT /api/users/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "fullName": "Updated User",
  "pictureUrl": "https://example.com/new-avatar.jpg",
  "provider": "github",
  "providerId": "987654321"
}
```

#### 6. Delete User

```
DELETE /api/users/{id}
```

**Response:**
```
200 OK
```

#### 7. User Statistics

```
GET /api/users/stats
```

**Response:**
```json
{
  "totalUsers": 5,
  "timestamp": 1699999999999
}
```

---

## Error Responses

### OAuth2.0 Errors

| Error Code | Description |
|------------|-------------|
| `invalid_request` | リクエストパラメータが不正 |
| `invalid_client` | クライアント認証失敗 |
| `invalid_grant` | 認可コードまたはリフレッシュトークンが無効 |
| `unauthorized_client` | クライアントが認可されていない |
| `unsupported_grant_type` | サポートされていないgrant_type |
| `invalid_scope` | 要求されたスコープが無効 |

**Example:**
```json
{
  "error": "invalid_grant",
  "error_description": "The provided authorization grant is invalid, expired, or revoked"
}
```

### Resource Server Errors

**401 Unauthorized:**
```json
{
  "error": "unauthorized",
  "error_description": "Full authentication is required to access this resource"
}
```

**403 Forbidden:**
```json
{
  "error": "insufficient_scope",
  "error_description": "The request requires higher privileges than provided by the access token"
}
```

---

## Test Commands

### 認可サーバのテスト

```bash
# OpenID Configuration取得
curl http://localhost:9000/.well-known/openid-configuration

# JWK Set取得
curl http://localhost:9000/oauth2/jwks
```

### リソースサーバのテスト

```bash
# パブリックエンドポイント
curl http://localhost:8080/api/public/status

# 保護されたエンドポイント（トークン必要）
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:8080/api/user/info

curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:8080/api/messages
```

### リソースオーナーのテスト

```bash
# ユーザー一覧取得
curl http://localhost:8082/api/users

# ユーザー作成
curl -X POST http://localhost:8082/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User"
  }'

# 統計情報取得
curl http://localhost:8082/api/users/stats
```
