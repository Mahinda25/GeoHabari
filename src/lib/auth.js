import crypto from 'node:crypto';
import {
  getAdminUserByEmail,
  getAdminUserById,
  saveAdminUser,
  createAdminSession,
  getAdminSession,
  deleteAdminSession,
  recordLoginAttempt,
  getRecentFailedLoginAttempts,
  appendAuditLog,
} from './ticketing-store.js';

export const ADMIN_COOKIE_NAME = 'gh_admin_session';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_WINDOW_MINUTES = 15;

/**
 * Derives a secure password hash using Node.js scrypt with unique salt
 */
export function hashPassword(password) {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Timing-safe password verification
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, salt, originalKeyHex] = parts;
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const originalKey = Buffer.from(originalKeyHex, 'hex');

    if (derivedKey.length !== originalKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, originalKey);
  } catch {
    return false;
  }
}

/**
 * Checks login rate limiting for IP and Email identifiers
 */
export async function checkRateLimit(identifier) {
  const attempts = await getRecentFailedLoginAttempts(identifier, LOCKOUT_WINDOW_MINUTES);
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    return {
      allowed: false,
      error: `Too many failed login attempts. Account temporarily locked for ${LOCKOUT_WINDOW_MINUTES} minutes.`,
    };
  }
  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts };
}

/**
 * Authenticates admin credentials with rate-limiting and audit logging
 */
export async function authenticateAdmin({ email, password, ipAddress = '', userAgent = '' }) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const rateCheck = await checkRateLimit(normalizedEmail);

  if (!rateCheck.allowed) {
    await recordLoginAttempt(normalizedEmail, false);
    await appendAuditLog({
      action: 'admin_login_locked',
      entity: 'admin_user',
      entity_id: null,
      details: { email: normalizedEmail, ipAddress },
    });
    return { success: false, error: rateCheck.error, status: 429 };
  }

  const user = await getAdminUserByEmail(normalizedEmail);

  if (!user || !user.is_active) {
    await recordLoginAttempt(normalizedEmail, false);
    await appendAuditLog({
      action: 'admin_login_failed',
      entity: 'admin_user',
      entity_id: null,
      details: { email: normalizedEmail, reason: 'user_not_found_or_inactive', ipAddress },
    });
    // Generic failure message to prevent user enumeration
    return { success: false, error: 'Invalid email or password.', status: 401 };
  }

  const isValidPassword = verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    await recordLoginAttempt(normalizedEmail, false);
    await appendAuditLog({
      action: 'admin_login_failed',
      entity: 'admin_user',
      entity_id: user.id,
      details: { email: normalizedEmail, reason: 'invalid_password', ipAddress },
    });
    return { success: false, error: 'Invalid email or password.', status: 401 };
  }

  // Record successful login
  await recordLoginAttempt(normalizedEmail, true);

  // Generate cryptographically secure session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  const session = await createAdminSession({
    user_id: user.id,
    session_token: sessionToken,
    user_agent: userAgent,
    ip_address: ipAddress,
    expires_at: expiresAt,
  });

  await appendAuditLog({
    action: 'admin_login_success',
    entity: 'admin_user',
    entity_id: user.id,
    details: { email: user.email, ipAddress, userAgent },
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
    session,
    sessionToken,
  };
}

/**
 * Validates session token from cookie or authorization header
 */
export async function validateSession(token) {
  if (!token) return null;
  return getAdminSession(token);
}

/**
 * Destroys admin session
 */
export async function logoutAdmin(token) {
  if (!token) return false;
  return deleteAdminSession(token);
}

/**
 * Extracts and verifies admin authentication from Request or Astro.cookies
 */
export async function getAdminFromRequest(request, cookies = null) {
  let token = null;

  // 1. Try Astro cookies if passed
  if (cookies && typeof cookies.get === 'function') {
    const cookieObj = cookies.get(ADMIN_COOKIE_NAME);
    if (cookieObj?.value) {
      token = cookieObj.value;
    }
  }

  // 2. Parse from request Cookie header if not found
  if (!token && request?.headers) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`));
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  // 3. Fallback: Authorization Bearer header
  if (!token && request?.headers) {
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  return validateSession(token);
}

/**
 * Provisions or updates an administrator account securely
 */
export async function provisionAdminUser({ email, password, fullName = 'Administrator', role = 'admin' }) {
  if (!email || !email.includes('@')) {
    throw new Error('Valid email address is required.');
  }

  const passwordHash = hashPassword(password);
  const user = await saveAdminUser({
    email,
    password_hash: passwordHash,
    full_name: fullName,
    role,
    is_active: true,
  });

  await appendAuditLog({
    action: 'admin_provisioned',
    entity: 'admin_user',
    entity_id: user.id,
    details: { email: user.email, role },
  });

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };
}

/**
 * Ensures initial administrator exists, bootstrapping from environment if needed
 */
export async function ensureInitialAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@geohabari.com';
  const existing = await getAdminUserByEmail(email);
  if (existing) {
    return existing;
  }

  const password = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || 'GeoHabari@2026Admin!';
  const fullName = process.env.INITIAL_ADMIN_NAME || 'GeoHabari System Administrator';

  return provisionAdminUser({
    email,
    password,
    fullName,
    role: 'superadmin',
  });
}
