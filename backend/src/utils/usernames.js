import supabase from '../database/connection.js';

/**
 * Username rules — kept in sync with the validate_username SQL function in
 * migrations/001. Both layers must agree, otherwise inserts fail with cryptic
 * trigger errors.
 *
 *   - 3-30 characters
 *   - first char: lowercase letter
 *   - remaining: lowercase letters, digits, underscore
 *
 * Reserved names live in the reserved_usernames table so they can be edited
 * without a redeploy. We cache them in-process for one minute to avoid
 * hitting the DB on every signup.
 */

const USERNAME_RE = /^[a-z][a-z0-9_]{2,29}$/;
const RESERVED_TTL_MS = 60_000;

let reservedCache = null;
let reservedCacheAt = 0;

const fetchReserved = async () => {
  const now = Date.now();
  if (reservedCache && now - reservedCacheAt < RESERVED_TTL_MS) {
    return reservedCache;
  }
  const { data, error } = await supabase
    .from('reserved_usernames')
    .select('username');
  if (error) throw error;
  reservedCache = new Set((data ?? []).map((r) => r.username.toLowerCase()));
  reservedCacheAt = now;
  return reservedCache;
};

/**
 * Validate format only (cheap, no DB hit). Returns null if valid, or an
 * error code string if not. Use isUsernameAvailable() for the full check.
 *
 * @param {string} raw
 * @returns {null | 'invalid_format' | 'reserved'}
 */
export const validateUsernameFormat = (raw) => {
  if (typeof raw !== 'string') return 'invalid_format';
  const username = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) return 'invalid_format';
  return null;
};

/**
 * Full availability check: format + reserved + uniqueness in users table.
 *
 * @param {string} raw
 * @param {{ excludeUserId?: number | string }} [opts]
 * @returns {Promise<{ ok: true, username: string }
 *                 | { ok: false, reason: 'invalid_format' | 'reserved' | 'taken' }>}
 */
export const checkUsernameAvailable = async (raw, opts = {}) => {
  const formatError = validateUsernameFormat(raw);
  if (formatError) return { ok: false, reason: formatError };

  const username = raw.trim().toLowerCase();
  const reserved = await fetchReserved();
  if (reserved.has(username)) return { ok: false, reason: 'reserved' };

  let query = supabase
    .from('users')
    .select('id')
    .ilike('username', username)
    .limit(1);

  if (opts.excludeUserId !== undefined && opts.excludeUserId !== null) {
    query = query.neq('id', opts.excludeUserId);
  }

  const { data, error } = await query.maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (data) return { ok: false, reason: 'taken' };

  return { ok: true, username };
};

const slugify = (input) =>
  String(input ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/**
 * Suggest a username derived from a name or email. Always returns something
 * that passes format validation. Used by Phase 2 onboarding to pre-fill the
 * username field; the user can still override.
 *
 * Note: this does NOT check uniqueness against the DB. Callers that need a
 * guaranteed-free name should call generateUniqueUsername() instead.
 *
 * @param {{ name?: string, email?: string }} source
 * @returns {string}
 */
export const suggestUsername = ({ name, email } = {}) => {
  const base =
    slugify(name) ||
    slugify(email?.split('@')[0]) ||
    'user';

  // Ensure it starts with a letter and respects min length.
  let candidate = base.replace(/^[^a-z]+/, '');
  if (candidate.length < 3) candidate = `user_${candidate}`.slice(0, 30);
  if (candidate.length > 30) candidate = candidate.slice(0, 30);
  return candidate.replace(/_+$/, '') || 'user';
};

/**
 * Try the suggestion, then suggestion_2, suggestion_3… until we find one
 * that is available. Caps at a few attempts to avoid hammering the DB —
 * after that we fall back to a random suffix.
 *
 * @param {{ name?: string, email?: string }} source
 * @returns {Promise<string>}
 */
export const generateUniqueUsername = async (source) => {
  const base = suggestUsername(source);
  for (let i = 0; i < 8; i++) {
    const candidate = i === 0 ? base : `${base}_${i + 1}`.slice(0, 30);
    const result = await checkUsernameAvailable(candidate);
    if (result.ok) return result.username;
  }
  // Last resort: short random suffix (still passes format).
  const random = Math.random().toString(36).slice(2, 7);
  const fallback = `${base.slice(0, 24)}_${random}`;
  return fallback;
};
