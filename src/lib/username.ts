/**
 * Username rules, sanitization, and reserved-word checking.
 *
 * This module is intentionally pure (no Firebase imports) so it can be used
 * both client-side (live validation as the user types) and referenced when
 * reasoning about Firestore security rules — the format rules here are
 * mirrored in firestore.rules so the server never trusts the client alone.
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

const USERNAME_PATTERN = /^[a-z0-9_-]+$/;
const EDGE_SEPARATOR_PATTERN = /^[_-]|[_-]$/;

// App routes (current + planned) plus common system/impersonation-adjacent
// words. Blocking these prevents a username from ever shadowing a real page
// or looking like an official/system account.
const RESERVED_USERNAMES = new Set<string>([
  // current + planned app routes
  'home', 'about', 'services', 'events', 'contact', 'login', 'register',
  'signup', 'signin', 'logout', 'signout', 'forgot-password',
  'reset-password', 'setup-profile', 'dashboard', 'settings', 'profile',
  'account',
  // common system / reserved paths worth blocking defensively
  'admin', 'administrator', 'api', 'app', 'assets', 'auth', 'blog', 'cdn',
  'config', 'docs', 'download', 'downloads', 'help', 'images', 'img', 'js',
  'css', 'mail', 'moderator', 'mod', 'news', 'null', 'oauth', 'public',
  'root', 'search', 'security', 'server', 'static', 'status', 'store',
  'support', 'system', 'test', 'undefined', 'user', 'users', 'www',
  'firebase', 'firestore', 'storage', '404', '500', 'me', 'anonymous',
  // brand
  'cybroatrix', 'cybroatri', 'cybroatrix.com',
]);

export function sanitizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export interface UsernameValidation {
  valid: boolean;
  error?: string;
}

/** Format + reserved-word validation only. Does NOT check availability —
 * that requires a Firestore read (see lib/profile.ts). */
export function validateUsernameFormat(rawUsername: string): UsernameValidation {
  const username = sanitizeUsername(rawUsername);

  if (!username) {
    return { valid: false, error: 'Username is required.' };
  }
  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters.` };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.` };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { valid: false, error: 'Only lowercase letters, numbers, underscores and hyphens are allowed.' };
  }
  if (EDGE_SEPARATOR_PATTERN.test(username)) {
    return { valid: false, error: "Username can't start or end with _ or -." };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { valid: false, error: 'That username is reserved. Please choose another.' };
  }
  return { valid: true };
}

export function isReservedUsername(rawUsername: string): boolean {
  return RESERVED_USERNAMES.has(sanitizeUsername(rawUsername));
}
