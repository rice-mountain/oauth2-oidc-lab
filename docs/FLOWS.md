# OAuth2.0 フロー図解

## Authorization Code Flow with PKCE

このドキュメントでは、PKCEを用いたAuthorization Code Flowの詳細な手順を説明します。

### フロー概要

```
+----------+                                  +---------------+
|          |                                  |               |
|  Client  |                                  | Authorization |
|          |                                  |     Server    |
|          |                                  |               |
+----------+                                  +---------------+
     |                                               |
     | (1) Code Verifier 生成                         |
     |     Code Challenge = SHA256(Code Verifier)    |
     |                                               |
     | (2) Authorization Request                     |
     |     + client_id                               |
     |     + redirect_uri                            |
     |     + code_challenge                          |
     |     + code_challenge_method=S256              |
     |---------------------------------------------->|
     |                                               |
     |                                               | (3) ユーザー認証
     |                                               |     ユーザー承認
     |                                               |
     | (4) Authorization Response                    |
     |     + code                                    |
     |     + state                                   |
     |<----------------------------------------------|
     |                                               |
     | (5) Token Request                             |
     |     + code                                    |
     |     + client_id                               |
     |     + code_verifier                           |
     |---------------------------------------------->|
     |                                               |
     |                                               | (6) Code Challenge検証
     |                                               |     SHA256(code_verifier)
     |                                               |     == code_challenge
     |                                               |
     | (7) Token Response                            |
     |     + access_token                            |
     |     + refresh_token                           |
     |     + token_type                              |
     |     + expires_in                              |
     |<----------------------------------------------|
     |                                               |
```

### 詳細手順

#### 1. Code Verifier と Code Challenge の生成

クライアントは以下を生成します：

```javascript
// Code Verifier: 43-128文字のランダム文字列
const codeVerifier = base64URLEncode(crypto.randomBytes(32));

// Code Challenge: Code VerifierのSHA256ハッシュ
const codeChallenge = base64URLEncode(
  crypto.createHash('sha256').update(codeVerifier).digest()
);
```

#### 2. Authorization Request

クライアントはユーザーを認可エンドポイントにリダイレクトします：

```
GET /oauth2/authorize?
  response_type=code
  &client_id=test-client
  &redirect_uri=http://localhost:3000/callback
  &scope=openid profile email read write
  &state=xyz123
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

#### 3. ユーザー認証・承認

認可サーバは：
1. ユーザーを認証（ログイン画面）
2. ユーザーに権限の承認を求める（同意画面）
3. Code Challengeをセッションに保存

#### 4. Authorization Response

認可後、ユーザーはリダイレクトURIにリダイレクトされます：

```
GET /callback?
  code=SplxlOBeZQQYbYS6WxSbIA
  &state=xyz123
```

#### 5. Token Request

クライアントは認可コードをトークンと交換します：

```
POST /oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=http://localhost:3000/callback
&client_id=test-client
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

#### 6. Code Challenge 検証

認可サーバは：
1. 保存されたCode Challengeを取得
2. Code VerifierからCode Challengeを再計算
3. 一致を確認：`SHA256(code_verifier) == code_challenge`

#### 7. Token Response

検証成功後、トークンを発行：

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8...",
  "scope": "openid profile email read write"
}
```

## Refresh Token Flow

アクセストークンが期限切れになった場合、リフレッシュトークンを使用して新しいアクセストークンを取得できます。

```
+----------+                                  +---------------+
|          |                                  |               |
|  Client  |                                  | Authorization |
|          |                                  |     Server    |
+----------+                                  +---------------+
     |                                               |
     | (1) Refresh Token Request                     |
     |     + grant_type=refresh_token                |
     |     + refresh_token                           |
     |     + client_id                               |
     |---------------------------------------------->|
     |                                               |
     |                                               | (2) Refresh Token検証
     |                                               |
     | (3) Token Response                            |
     |     + access_token                            |
     |     + refresh_token (optional)                |
     |     + expires_in                              |
     |<----------------------------------------------|
     |                                               |
```

### Request Example

```
POST /oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=8xLOxBtZp8
&client_id=test-client
```

### Response Example

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "9yMPyCtZq9...",
  "scope": "openid profile email read write"
}
```

## Resource Access Flow

アクセストークンを使用してリソースサーバのAPIにアクセスします。

```
+----------+                                  +---------------+
|          |                                  |               |
|  Client  |                                  |   Resource    |
|          |                                  |    Server     |
+----------+                                  +---------------+
     |                                               |
     | (1) API Request                               |
     |     Authorization: Bearer <access_token>      |
     |---------------------------------------------->|
     |                                               |
     |                                               | (2) Token検証
     |                                               |     - 署名確認
     |                                               |     - 有効期限確認
     |                                               |     - スコープ確認
     |                                               |
     | (3) API Response                              |
     |     + Protected Resource                      |
     |<----------------------------------------------|
     |                                               |
```

### Request Example

```
GET /api/messages
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JWT Token Structure

JWTトークンは3つの部分で構成されます：

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.     <- Header
eyJzdWIiOiJ1c2VyIiwic2NvcGUiOlsicmVhZCJd...  <- Payload
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  <- Signature
```

#### Header
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-id"
}
```

#### Payload
```json
{
  "sub": "user",
  "iss": "http://localhost:9000",
  "aud": ["resource-server"],
  "exp": 1699999999,
  "iat": 1699996399,
  "scope": ["openid", "profile", "email", "read"]
}
```

## スコープとアクセス制御

### スコープの種類

| スコープ | 説明 | 用途 |
|---------|------|------|
| `openid` | OpenID Connectの基本スコープ | ID Token発行 |
| `profile` | プロフィール情報へのアクセス | 名前、画像等 |
| `email` | メールアドレスへのアクセス | メール情報 |
| `read` | 読み取り権限 | GET API |
| `write` | 書き込み権限 | POST/PUT/DELETE API |
| `admin` | 管理者権限 | 管理用API |

### エンドポイントとスコープのマッピング

| エンドポイント | 必要なスコープ | 説明 |
|--------------|--------------|------|
| `/api/public/status` | なし | パブリックAPI |
| `/api/user/info` | 認証のみ | ユーザー情報 |
| `/api/messages` | `read` | メッセージ取得 |
| `/api/messages/write` | `write` | メッセージ作成 |
| `/api/admin/data` | `admin` | 管理者データ |

## セキュリティ考慮事項

### PKCE の重要性

PKCEなしの場合、攻撃者が認可コードを傍受すると：
1. 攻撃者が認可コードを取得
2. 攻撃者がトークンエンドポイントにアクセス
3. アクセストークンを不正取得

PKCEありの場合：
1. 攻撃者が認可コードを取得
2. 攻撃者がトークンエンドポイントにアクセス
3. Code Verifierがないため検証失敗
4. トークン発行拒否

### State パラメータ

CSRFを防ぐために：
1. リクエスト時にランダムなstateを生成
2. Sessionに保存
3. コールバック時にstateを検証

### トークンの保存

- **ブラウザ**: HttpOnly Cookie推奨
- **モバイルアプリ**: Secure Storage使用
- **SPA**: メモリに保持、LocalStorage/SessionStorageは避ける

### Token Rotation

リフレッシュトークンローテーション：
- 使用済みのリフレッシュトークンは無効化
- 新しいリフレッシュトークンを発行
- リプレイアタック対策
