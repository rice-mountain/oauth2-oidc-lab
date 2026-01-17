import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { GoogleProvider } from './providers/google-provider.js';
import { GitHubProvider } from './providers/github-provider.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'oauth2-oidc-lab-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Initialize OAuth2.0 providers
const providers = {};

// Google provider
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.google = new GoogleProvider(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:${PORT}/callback/google`
  );
}

// GitHub provider
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.github = new GitHubProvider(
    process.env.GITHUB_CLIENT_ID,
    process.env.GITHUB_CLIENT_SECRET,
    `http://localhost:${PORT}/callback/github`
  );
}

// Home page
app.get('/', (req, res) => {
  const user = req.session.user;
  
  if (user) {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth2.0/OIDC Lab - Authenticated</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .user-info { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .token-info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
            button { padding: 10px 20px; margin: 5px; cursor: pointer; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>OAuth2.0/OIDC Lab - Authenticated</h1>
          <div class="user-info">
            <h2>User Information</h2>
            <pre>${JSON.stringify(user.userInfo, null, 2)}</pre>
          </div>
          <div class="token-info">
            <h2>Token Information</h2>
            <p><strong>Provider:</strong> ${user.provider}</p>
            <p><strong>Access Token:</strong> ${user.accessToken.substring(0, 20)}...</p>
            ${user.refreshToken ? `<p><strong>Refresh Token:</strong> ${user.refreshToken.substring(0, 20)}...</p>` : ''}
            <p><strong>Expires In:</strong> ${user.expiresIn} seconds</p>
          </div>
          <button onclick="window.location.href='/logout'">Logout</button>
          ${user.refreshToken ? '<button onclick="window.location.href=\'/refresh\'">Refresh Token</button>' : ''}
        </body>
      </html>
    `);
  } else {
    const providerButtons = Object.keys(providers).map(name => 
      `<button onclick="window.location.href='/auth/${name}'">${name.toUpperCase()}</button>`
    ).join('\n');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth2.0/OIDC Lab</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; text-align: center; }
            h1 { color: #333; }
            .info { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: left; }
            button { padding: 15px 30px; margin: 10px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px; }
            button:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <h1>OAuth2.0/OIDC Lab</h1>
          <div class="info">
            <h2>About</h2>
            <p>This is a demonstration of OAuth2.0 and OpenID Connect flows with:</p>
            <ul>
              <li>Authorization Code Flow with PKCE (Proof Key for Code Exchange)</li>
              <li>Refresh Token Support</li>
              <li>Scope and Claims Handling</li>
              <li>Multiple Identity Providers (Google, GitHub)</li>
            </ul>
          </div>
          <h2>Login with:</h2>
          ${providerButtons || '<p>No providers configured. Please set up environment variables.</p>'}
        </body>
      </html>
    `);
  }
});

// Initiate OAuth2.0 flow
app.get('/auth/:provider', (req, res) => {
  const providerName = req.params.provider;
  const provider = providers[providerName];

  if (!provider) {
    return res.status(404).send('Provider not found');
  }

  const { url, state, codeVerifier } = provider.getAuthorizationUrl();

  // Store state and code verifier in session for verification
  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;
  req.session.provider = providerName;

  res.redirect(url);
});

// OAuth2.0 callback
app.get('/callback/:provider', async (req, res) => {
  const providerName = req.params.provider;
  const provider = providers[providerName];

  if (!provider) {
    return res.status(404).send('Provider not found');
  }

  const { code, state, error } = req.query;

  // Check for errors from provider
  if (error) {
    return res.status(400).send(`Authentication error: ${error}`);
  }

  // Verify state to prevent CSRF
  if (state !== req.session.oauthState) {
    return res.status(400).send('Invalid state parameter');
  }

  try {
    // Exchange code for tokens
    const tokens = await provider.exchangeCodeForTokens(code, req.session.codeVerifier);

    // Get user information
    const userInfo = await provider.getUserInfo(tokens.access_token);

    // Store user session
    req.session.user = {
      provider: providerName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      userInfo: userInfo,
    };

    // Clean up OAuth session data
    delete req.session.oauthState;
    delete req.session.codeVerifier;
    delete req.session.provider;

    res.redirect('/');
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// Refresh token endpoint
app.get('/refresh', async (req, res) => {
  if (!req.session.user || !req.session.user.refreshToken) {
    return res.status(400).send('No refresh token available');
  }

  const providerName = req.session.user.provider;
  const provider = providers[providerName];

  try {
    const tokens = await provider.refreshAccessToken(req.session.user.refreshToken);

    // Update session with new tokens
    req.session.user.accessToken = tokens.access_token;
    if (tokens.refresh_token) {
      req.session.user.refreshToken = tokens.refresh_token;
    }
    req.session.user.expiresIn = tokens.expires_in;

    res.redirect('/');
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).send('Failed to refresh token');
  }
});

// Logout endpoint
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`OAuth2.0/OIDC Client running on http://localhost:${PORT}`);
  console.log('\nConfigured providers:');
  Object.keys(providers).forEach(name => {
    console.log(`  - ${name.toUpperCase()}`);
  });
  if (Object.keys(providers).length === 0) {
    console.log('  (none - please configure environment variables)');
  }
});
