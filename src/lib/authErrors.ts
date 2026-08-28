import { FirebaseError } from 'firebase/app';

/**
 * Maps Firebase Auth error codes to user-facing copy. Never show
 * error.message from the SDK directly — it leaks internal wording like
 * "Firebase: Error (auth/wrong-password)." to end users.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': "That email address doesn't look right.",
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/missing-password': 'Please enter a password.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-login-credentials': 'Incorrect email or password.',
  'auth/user-disabled': 'This account has been disabled. Contact support if you think this is a mistake.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error — check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
  'auth/requires-recent-login': 'For security, please sign in again to complete this action.',
  'auth/expired-action-code': 'This link has expired. Please request a new one.',
  'auth/invalid-action-code': 'This link is invalid or has already been used.',
  'auth/user-token-expired': 'Your session has expired. Please sign in again.',
  'auth/user-mismatch': "This doesn't match the signed-in account.",
  'auth/operation-not-allowed': "This sign-in method isn't enabled right now.",
  'auth/unauthorized-domain': "This domain isn't authorized for sign-in yet.",
  'auth/username-taken': 'That username is already taken.',
};

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Converts any error thrown during an auth/profile operation into safe,
 * friendly copy. Handles three cases:
 *  1. Real FirebaseError instances -> looked up in the map above.
 *  2. Plain Error we threw ourselves for client-side validation (e.g.
 *     "Passwords do not match") -> shown as-is, since it never came from
 *     the SDK and is already user-safe.
 *  3. Anything else / unrecognized -> generic fallback.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? FALLBACK_MESSAGE;
  }
  if (error instanceof Error && error.message && !/firebase/i.test(error.message)) {
    return error.message;
  }
  return FALLBACK_MESSAGE;
}
