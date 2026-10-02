/**
 * Helper d'autorisation administrateur pour AscendUAC
 */
import { AdminService } from '@/lib/storage/admin-service';

// Adresses email autorisées par défaut à administrer la plateforme
const DEFAULT_ADMIN_EMAILS = [
  'optossou@gmail.com',
  'ulrrichmagbonde@gmail.com',
  'richomagbonde@gmail.com',
];

/**
 * Vérifie de manière synchrone si une adresse email fait partie des administrateurs statiques
 */
export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  const envAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const allowed = new Set(DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()));
  if (envAdmin) allowed.add(envAdmin);

  return allowed.has(normalized);
}

/**
 * Vérifie de manière asynchrone (incluant la base de données Neon)
 */
export async function isUserAdminAsync(email?: string | null): Promise<boolean> {
  if (isAdmin(email)) return true;
  return await AdminService.isEmailAdmin(email);
}
