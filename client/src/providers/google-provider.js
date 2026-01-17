import { OAuth2Provider } from './oauth2-provider.js';

/**
 * Google OAuth2.0/OIDC Provider
 * Documentation: https://developers.google.com/identity/protocols/oauth2
 * Note: Google OAuth supports PKCE for enhanced security
 */
export class GoogleProvider extends OAuth2Provider {
  constructor(clientId, clientSecret, redirectUri) {
    super({
      name: 'google',
      clientId,
      clientSecret,
      redirectUri,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: 'openid profile email',
    });
  }
}
