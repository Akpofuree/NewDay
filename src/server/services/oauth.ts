import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { AppError } from '../errors';

const googleClient = new OAuth2Client(config.googleClientId);

export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload.sub) {
    throw new AppError(401, 'Google authentication failed.', 'GOOGLE_AUTH_FAILED');
  }

  return {
    providerId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
    avatarUrl: payload.picture || null,
  };
}
