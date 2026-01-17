import { OAuth2Provider } from './oauth2-provider.js';

/**
 * GitHub OAuth2.0 Provider
 * Documentation: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps
 */
export class GitHubProvider extends OAuth2Provider {
  constructor(clientId, clientSecret, redirectUri) {
    super({
      name: 'github',
      clientId,
      clientSecret,
      redirectUri,
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
      userInfoEndpoint: 'https://api.github.com/user',
      scope: 'read:user user:email',
    });
  }

  /**
   * Override token exchange to handle GitHub's Accept header requirement
   * Note: GitHub OAuth does not support PKCE, so codeVerifier is not used
   */
  async exchangeCodeForTokens(code, codeVerifier) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: this.redirectUri,
    });

    // Note: GitHub OAuth does not support PKCE (code_verifier not sent)

    try {
      const axios = (await import('axios')).default;
      const response = await axios.post(this.tokenEndpoint, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for tokens');
    }
  }
}
