import crypto from 'node:crypto';

import {
  hashSessionToken
} from './auth.js';

import { pool } from './db.js';

const SESSION_COOKIE = 'nawa_admin_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export async function createAdminSession(adminEmail) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MS
  );

  await pool.query(
    `
      INSERT INTO admin_sessions (
        token_hash,
        admin_email,
        expires_at
      )
      VALUES ($1, $2, $3)
    `,
    [
      tokenHash,
      adminEmail,
      expiresAt
    ]
  );

  return {
    token,
    expiresAt
  };
}

function parseCookies(cookieHeader = '') {
  const cookies = {};

  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=');

    if (index === -1) continue;

    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    cookies[name] = decodeURIComponent(value);
  }

  return cookies;
}

export async function requireAdmin(req, res, next) {
  try {
    console.log('[AUTH] REQUIRE ADMIN');

    const cookieHeader = req.headers.cookie || '';

    console.log(
      '[AUTH] COOKIE HEADER EXISTS:',
      Boolean(cookieHeader)
    );

    const cookies = parseCookies(cookieHeader);

    const token = cookies[SESSION_COOKIE];

    console.log(
      '[AUTH] SESSION COOKIE EXISTS:',
      Boolean(token)
    );

    if (!token) {
      console.log(
        '[AUTH] REQUIRE ADMIN → 401 NO COOKIE'
      );

      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    const tokenHash = hashSessionToken(token);

    const { rows } = await pool.query(
      `
        SELECT
          id,
          admin_email,
          expires_at
        FROM admin_sessions
        WHERE token_hash = $1
          AND expires_at > now()
        LIMIT 1
      `,
      [tokenHash]
    );

    console.log(
      '[AUTH] SESSION FOUND:',
      Boolean(rows[0])
    );

    if (!rows[0]) {
      console.log(
        '[AUTH] REQUIRE ADMIN → 401 INVALID OR EXPIRED SESSION'
      );

      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    await pool.query(
      `
        UPDATE admin_sessions
        SET last_seen_at = now()
        WHERE id = $1
      `,
      [rows[0].id]
    );

    req.admin = {
      email: rows[0].admin_email,
      sessionId: rows[0].id
    };

    console.log(
      '[AUTH] REQUIRE ADMIN → SUCCESS:',
      rows[0].admin_email
    );

    next();
  } catch (error) {
    console.error(
      '[AUTH] REQUIRE ADMIN ERROR:',
      error
    );

    res.status(500).json({
      error: 'Authentication check failed.'
    });
  }
}

export async function deleteAdminSession(req, res) {
  const cookies = parseCookies(
    req.headers.cookie
  );

  const token = cookies[SESSION_COOKIE];

  if (token) {
    const tokenHash = hashSessionToken(token);

    await pool.query(
      `
        DELETE FROM admin_sessions
        WHERE token_hash = $1
      `,
      [tokenHash]
    );
  }

  const secure =
    process.env.NODE_ENV === 'production'
      ? ' Secure;'
      : '';

  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; SameSite=None; Path=/; Max-Age=0;${secure}`
  );

  res.json({
    ok: true
  });
}