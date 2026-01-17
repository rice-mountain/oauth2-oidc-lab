import axios from 'axios';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../utils/pkce.js';

/**
 * Base OAuth2.0 provider implementation
 */
export class OAuth2Provider {
  constructor(config) {
    this.name = config.name;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.authorizationEndpoint = config.authorizationEndpoint;
    this.tokenEndpoint = config.tokenEndpoint;
    this.userInfoEndpoint = config.userInfoEndpoint;
    this.scope = config.scope || 'openid profile email';
  }

  /**
   * Generate authorization URL with PKCE
   * @returns {object} Authorization URL and session data
   */
  getAuthorizationUrl() {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${this.authorizationEndpoint}?${params.toString()}`;

    return {
      url: authUrl,
      state: state,
      codeVerifier: codeVerifier,
    };
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code
   * @param {string} codeVerifier - PKCE code verifier
   * @returns {Promise<object>} Token response
   */
  async exchangeCodeForTokens(code, codeVerifier) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      code_verifier: codeVerifier,
    });

    // Add client secret if provided (required for some providers)
    if (this.clientSecret) {
      params.append('client_secret', this.clientSecret);
    }

    try {
      const response = await axios.post(this.tokenEndpoint, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for tokens');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<object>} New token response
   */
  async refreshAccessToken(refreshToken) {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
    });

    if (this.clientSecret) {
      params.append('client_secret', this.clientSecret);
    }

    try {
      const response = await axios.post(this.tokenEndpoint, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get user information using access token
   * @param {string} accessToken - Access token
   * @returns {Promise<object>} User information
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Get user info error:', error.response?.data || error.message);
      throw new Error('Failed to get user information');
    }
  }
}
