import postgres, { Sql } from 'postgres';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

function cleanNeonUrl(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/^["'](.*)["']$/, '$1').trim();
}

export function getDatabaseUrl(): string {
  return cleanNeonUrl(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);
}

/**
 * Vérifie si la base de données est correctement configurée
 */
export function isNeonConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

/**
 * Retourne un client SQL prêt à l'emploi (Prisma Postgres ou Neon).
 * Utilise un singleton global pour éviter de créer trop de connexions en dev.
 */
export function getNeonClient(): any {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      'DATABASE_URL ou NEON_DATABASE_URL est absent. Ajoutez-le dans .env.local.'
    );
  }
  // Si c'est un endpoint HTTP Neon (neon.tech)
  if (url.includes('.neon.tech')) {
    return neon(url);
  }
  // Pour Prisma Postgres (db.prisma.io) ou PostgreSQL classique
  return postgres(url, { max: 10, idle_timeout: 20 });
}

export type NeonSql = any;

// Singleton global pour dev (hot-reload Next.js)
const globalForNeon = globalThis as unknown as { 
  _neonSql?: NeonSql;
  _neonUrl?: string;
};

export function getSql(): NeonSql {
  const currentUrl = getDatabaseUrl();
  if (!globalForNeon._neonSql || globalForNeon._neonUrl !== currentUrl) {
    globalForNeon._neonSql = getNeonClient();
    globalForNeon._neonUrl = currentUrl;
  }
  return globalForNeon._neonSql;
}

// Proxy callable comme fonction tagged template
export const sql: NeonSql = ((strings: any, ...values: any[]) => {
  const client = getSql();
  return (client as any)(strings, ...values);
}) as any;
