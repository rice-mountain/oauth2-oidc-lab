# OAuth2.0 Client

Node.js implementation of OAuth2.0 client with PKCE support.

## Features

- Authorization Code Flow with PKCE (RFC 7636)
- Multiple OAuth2.0 providers (Google, GitHub)
- Refresh token support
- Session management
- Express-based web UI

## OAuth2.0 Providers

### Google
- Supports PKCE for enhanced security
- OpenID Connect compliant
- Scopes: `openid profile email`

### GitHub
- Standard OAuth 2.0 flow
- **Note**: GitHub does not support PKCE, so client secret is required
- Scopes: `read:user user:email`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Configure OAuth2.0 credentials in `.env`

4. Start the application:
```bash
npm start
```

The client will be available at http://localhost:3000

## Environment Variables

- `PORT`: Server port (default: 3000)
- `SESSION_SECRET`: Secret key for session management
- `GOOGLE_CLIENT_ID`: Google OAuth2.0 client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth2.0 client secret
- `GITHUB_CLIENT_ID`: GitHub OAuth2.0 client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth2.0 client secret

## Project Structure

```
client/
├── src/
│   ├── index.js                    # Main application
│   ├── providers/
│   │   ├── oauth2-provider.js      # Base OAuth2.0 provider
│   │   ├── google-provider.js      # Google provider
│   │   └── github-provider.js      # GitHub provider
│   └── utils/
│       └── pkce.js                 # PKCE utilities
├── package.json
├── .env.example
└── Dockerfile
```
