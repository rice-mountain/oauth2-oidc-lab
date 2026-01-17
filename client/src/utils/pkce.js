import crypto from 'crypto';

/**
 * PKCE (Proof Key for Code Exchange) utility functions
 * RFC 7636: https://tools.ietf.org/html/rfc7636
 */

/**
 * Generate a random code verifier
 * @returns {string} Base64 URL-encoded code verifier (43-128 characters)
 */
export function generateCodeVerifier() {
  const randomBytes = crypto.randomBytes(32);
  return base64URLEncode(randomBytes);
}

/**
 * Generate code challenge from code verifier using S256 method
 * @param {string} codeVerifier - The code verifier
 * @returns {string} Base64 URL-encoded code challenge
 */
export function generateCodeChallenge(codeVerifier) {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return base64URLEncode(hash);
}

/**
 * Base64 URL encode (without padding)
 * @param {Buffer} buffer - Buffer to encode
 * @returns {string} Base64 URL-encoded string
 */
function base64URLEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a random state parameter for CSRF protection
 * @returns {string} Random state string
 */
export function generateState() {
  return crypto.randomBytes(16).toString('hex');
}
