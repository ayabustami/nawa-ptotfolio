import crypto from 'node:crypto';

const SCRYPT_KEYLEN = 64;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET is not set.');
  }

  return secret;
}

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');

    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const parts = storedHash.split(':');

    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      resolve(false);
      return;
    }

    const [, salt, storedKey] = parts;
    const storedBuffer = Buffer.from(storedKey, 'hex');

    crypto.scrypt(
      password,
      salt,
      storedBuffer.length,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        if (derivedKey.length !== storedBuffer.length) {
          resolve(false);
          return;
        }

        resolve(
          crypto.timingSafeEqual(
            derivedKey,
            storedBuffer
          )
        );
      }
    );
  });
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(token)
    .digest('hex');
}