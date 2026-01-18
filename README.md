# OAuth2.0 / OpenID Connect Lab

OAuth2.0 / OpenID Connect の技術検証用モノレポジトリ。

## 概要

このプロジェクトは、OAuth2.0とOpenID Connect（OIDC）の主要なフローを学習・検証するための実装例です。以下のコンポーネントで構成されています：

### コンポーネント

1. **Node.js クライアント** (`/client`)
   - Authorization Code + PKCE フローの実装
   - Google / GitHub をプロバイダとして利用
   - リフレッシュトークンのサポート
   - スコープとクレームの処理

2. **Spring Boot 認可サーバ** (`/authorization-server`)
   - モックOAuth2.0/OIDC認可サーバ
   - PKCE (RFC 7636) サポート
   - JWTトークン発行
   - リフレッシュトークン対応

3. **Spring Boot リソースサーバ** (`/resource-server`)
   - JWT検証
   - スコープベースの認可
   - 保護されたAPIエンドポイント

4. **Spring Boot リソースオーナー** (`/resource-owner`)
   - ユーザー管理サービス
   - H2インメモリデータベース
   - REST API

## 主要機能

### Authorization Code Flow with PKCE
- より安全な認可コードフロー（RFC 7636）
- Code Verifier と Code Challenge を使用したCSRF対策
- パブリッククライアントでも安全に利用可能

### リフレッシュトークン
- アクセストークンの自動更新
- 長期間のセッション維持

### スコープとクレーム
- きめ細かいアクセス制御
- OpenID Connect のスコープ（openid, profile, email）
- カスタムスコープ（read, write, admin）

## アーキテクチャ

```
┌─────────────────┐
│  Node.js Client │
│   (Port 3000)   │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌──────────────────┐  ┌─────────────────┐
│ Google/GitHub    │  │ Authorization   │
│ OAuth2 Provider  │  │ Server          │
│                  │  │ (Port 9000)     │
└──────────────────┘  └────────┬────────┘
                              │
                              │ JWT
                              │
         ┌────────────────────┴─────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐         ┌──────────────────┐
│ Resource Server │         │ Resource Owner   │
│  (Port 8080)    │         │   (Port 8082)    │
└─────────────────┘         └──────────────────┘
```

## セットアップ

### 前提条件

- Node.js 18以上
- Java 17以上
- Gradle 8.5以上（Gradle Wrapperが含まれています）

### 1. Node.js クライアントのセットアップ

```bash
cd client
npm install
cp .env.example .env
```

`.env` ファイルを編集して、Google/GitHubのOAuth2.0クレデンシャルを設定：

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### Google OAuth2.0 クレデンシャルの取得

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) にアクセス
2. プロジェクトを作成
3. 「OAuth 2.0 クライアント ID」を作成
4. リダイレクトURIに `http://localhost:3000/callback/google` を追加

**Note:** Google OAuth2.0はPKCEをサポートしています。

#### GitHub OAuth2.0 クレデンシャルの取得

1. [GitHub Developer Settings](https://github.com/settings/developers) にアクセス
2. 「New OAuth App」を作成
3. Authorization callback URLに `http://localhost:3000/callback/github` を設定

**Note:** GitHub OAuth2.0は標準のOAuth 2.0フローを使用しますが、PKCEはサポートしていません。このため、GitHub認証ではクライアントシークレットが必要です。

### 2. Spring Boot サービスのビルド

```bash
# 認可サーバ
cd authorization-server
./gradlew build

# リソースサーバ
cd ../resource-server
./gradlew build

# リソースオーナー
cd ../resource-owner
./gradlew build
```

## 起動方法

各サービスを別々のターミナルで起動します：

### 1. 認可サーバを起動（ポート 9000）

```bash
cd authorization-server
./gradlew bootRun
```

デフォルトユーザー：
- ユーザー名: `user` / パスワード: `password`
- ユーザー名: `admin` / パスワード: `admin`

### 2. リソースサーバを起動（ポート 8080）

```bash
cd resource-server
./gradlew bootRun
```

### 3. リソースオーナーを起動（ポート 8082）

```bash
cd resource-owner
./gradlew bootRun
```

H2コンソール: http://localhost:8082/h2-console

### 4. Node.js クライアントを起動（ポート 3000）

```bash
cd client
npm start
```

クライアントアプリケーション: http://localhost:3000

## 動作確認

### Google/GitHub OAuth2.0フロー

1. http://localhost:3000 にアクセス
2. 「GOOGLE」または「GITHUB」ボタンをクリック
3. プロバイダの認証画面で認証
4. リダイレクト後、ユーザー情報とトークン情報を確認

### 自前認可サーバのテスト

認可サーバのエンドポイント：

- Authorization Endpoint: `http://localhost:9000/oauth2/authorize`
- Token Endpoint: `http://localhost:9000/oauth2/token`
- JWK Set URI: `http://localhost:9000/oauth2/jwks`
- OpenID Configuration: `http://localhost:9000/.well-known/openid-configuration`

テストクライアント設定：
- Client ID: `test-client`
- Client Secret: `test-secret`
- Redirect URI: `http://localhost:3000/callback` または `http://localhost:8081/authorized`

### リソースサーバAPIのテスト

パブリックエンドポイント（認証不要）：
```bash
curl http://localhost:8080/api/public/status
```

保護されたエンドポイント（JWTトークン必要）：
```bash
# トークン取得後
curl -H "Authorization: Bearer <access_token>" http://localhost:8080/api/user/info
curl -H "Authorization: Bearer <access_token>" http://localhost:8080/api/messages
```

スコープ別のエンドポイント：
- `/api/messages` - `read` スコープが必要
- `/api/messages/write` - `write` スコープが必要
- `/api/admin/data` - `admin` スコープが必要

### リソースオーナーAPIのテスト

```bash
# 全ユーザー取得
curl http://localhost:8082/api/users

# ユーザー作成
curl -X POST http://localhost:8082/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","fullName":"Test User"}'

# 統計情報
curl http://localhost:8082/api/users/stats
```

## OAuth2.0 フロー詳細

### Authorization Code + PKCE フロー

```
1. クライアント: Code Verifier 生成
2. クライアント: Code Challenge 生成 (SHA256(Code Verifier))
3. クライアント → 認可サーバ: Authorization Request (+ Code Challenge)
4. ユーザー: 認証・認可
5. 認可サーバ → クライアント: Authorization Code
6. クライアント → 認可サーバ: Token Request (+ Code Verifier)
7. 認可サーバ: Code Challenge 検証
8. 認可サーバ → クライアント: Access Token + Refresh Token
9. クライアント → リソースサーバ: API Request (+ Access Token)
10. リソースサーバ: Token 検証
11. リソースサーバ → クライアント: Protected Resource
```

### リフレッシュトークンフロー

```
1. クライアント: Access Token 期限切れ検出
2. クライアント → 認可サーバ: Refresh Token Request
3. 認可サーバ → クライアント: 新しい Access Token (+ 新しい Refresh Token)
```

## セキュリティ考慮事項

### PKCE (Proof Key for Code Exchange)
- 認可コードインターセプション攻撃の防止
- パブリッククライアントでも安全

### State Parameter
- CSRF攻撃の防止
- 各認可リクエストで一意な値を使用

### Secure Storage
- トークンは安全に保存（本番環境ではHttpOnly Cookieやセキュアストレージを使用）
- クライアントシークレットは環境変数で管理

### Token Validation
- JWTの署名検証
- トークンの有効期限確認
- スコープの検証

## 今後の拡張

- [ ] データベース永続化（PostgreSQL等）
- [ ] Docker Compose によるオーケストレーション
- [ ] OpenID Connect の完全実装（ID Token、UserInfo Endpoint等）
- [ ] より高度な認可パターン（Device Code Flow、Client Credentials Flow等）
- [ ] トークン取り消しエンドポイント
- [ ] 動的クライアント登録
- [ ] カスタムクレームの追加

## 参考資料

- [RFC 6749 - The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 7636 - Proof Key for Code Exchange (PKCE)](https://tools.ietf.org/html/rfc7636)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [Spring Authorization Server Documentation](https://docs.spring.io/spring-authorization-server/docs/current/reference/html/)

## ライセンス

MIT License
