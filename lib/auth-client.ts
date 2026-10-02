import { signIn } from 'next-auth/react';

/**
 * Lance la connexion :
 * - Si les clés GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET sont configurées dans .env.local, utilise Google OAuth.
 * - Sinon (en développement local), connecte automatiquement l'utilisateur avec un compte démo pour ne pas le bloquer.
 */
export async function loginWithGoogleOrDemo(callbackUrl = '/epreuves') {
  try {
    const res = await fetch('/api/auth/providers');
    const providers = await res.json();
    if (providers?.google) {
      return signIn('google', { callbackUrl });
    } else {
      return signIn('credentials', {
        email: 'optossou@gmail.com',
        name: 'Étudiant / Développeur (optossou@gmail.com)',
        callbackUrl,
      });
    }
  } catch {
    return signIn('google', { callbackUrl });
  }
}
