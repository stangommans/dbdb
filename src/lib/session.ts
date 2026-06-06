import { cookies } from 'next/headers';
import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'fallback-super-secret-key-1234567890-dbdb';
const COOKIE_NAME = 'dbdb_reviewer_token';

interface SessionPayload {
  uuid: string;
  rawToken: string;
  isNew: boolean;
}

/**
 * Retrieves the cryptographically signed reviewer cookie token.
 * If verified, extracts the user's UUID.
 * If missing, invalid, or tampered, mints a brand-new signed UUID.
 */
export async function getOrCreateReviewerToken(): Promise<SessionPayload> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);

    if (cookie?.value) {
      const parts = cookie.value.split('.');
      if (parts.length === 2) {
        const [uuid, signature] = parts;
        
        // Re-generate timing-safe signature comparison
        const expectedSignature = crypto
          .createHmac('sha256', SECRET)
          .update(uuid)
          .digest('hex');

        const signatureBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        // Verify timing-safe similarity to guard against timing attacks
        if (
          signatureBuffer.length === expectedBuffer.length &&
          crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
        ) {
          return { uuid, rawToken: cookie.value, isNew: false };
        }
      }
    }
  } catch (err) {
    console.error('Error parsing session cookie:', err);
  }

  // Create a brand-new secure identity
  const newUuid = crypto.randomUUID();
  const newSignature = crypto
    .createHmac('sha256', SECRET)
    .update(newUuid)
    .digest('hex');
  const rawToken = `${newUuid}.${newSignature}`;

  return { uuid: newUuid, rawToken, isNew: true };
}

/**
 * Persists the cryptographically signed reviewer token in HTTP-only cookies for 10 years.
 */
export async function setReviewerCookie(rawToken: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10 // 10 Years persistence
    });
  } catch (err) {
    console.error('Failed to write reviewer session cookie:', err);
  }
}
