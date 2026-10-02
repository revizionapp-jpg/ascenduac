import { NextResponse } from 'next/server';
import { getSql, isNeonConfigured } from '@/lib/db/neon';
import { ensureAdminTablesExist } from '@/lib/db/schema-init';
import { MOCK_UES } from '@/lib/storage/notes-mock';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semester = searchParams.get('semester');

    // Si Neon n'est pas configuré, retourner les données mockées officielles MBH1
    if (!isNeonConfigured()) {
      let ues = MOCK_UES;
      if (semester === '1' || semester === '2' || semester === '3') {
        ues = ues.filter((u) => u.semester === semester);
      }
      return NextResponse.json({ ues });
    }

    await ensureAdminTablesExist();
    const sql = getSql();

    let ues;
    if (semester === '1' || semester === '2' || semester === '3') {
      ues = await sql`
        SELECT u.code, u.name, u.credits, u.semester, COALESCE(u.type, 'fondamentale') AS type,
               COALESCE(json_agg(json_build_object('id', e.id, 'name', e.name) ORDER BY e.id) FILTER (WHERE e.id IS NOT NULL), '[]'::json) AS ecus
        FROM ues u
        LEFT JOIN ecus e ON e.ue_code = u.code
        WHERE u.semester = ${semester}
        GROUP BY u.code, u.name, u.credits, u.semester, u.type
        ORDER BY u.code;
      `;
    } else {
      ues = await sql`
        SELECT u.code, u.name, u.credits, u.semester, COALESCE(u.type, 'fondamentale') AS type,
               COALESCE(json_agg(json_build_object('id', e.id, 'name', e.name) ORDER BY e.id) FILTER (WHERE e.id IS NOT NULL), '[]'::json) AS ecus
        FROM ues u
        LEFT JOIN ecus e ON e.ue_code = u.code
        GROUP BY u.code, u.name, u.credits, u.semester, u.type
        ORDER BY u.semester, u.code;
      `;
    }

    return NextResponse.json({ ues });
  } catch (error) {
    console.error('GET /api/notes/ues error:', error);
    // En cas d'erreur de base de données, fallback propre vers le mock officiel MBH1
    const { searchParams } = new URL(request.url);
    const semester = searchParams.get('semester');
    let ues = MOCK_UES;
    if (semester === '1' || semester === '2' || semester === '3') {
      ues = ues.filter((u) => u.semester === semester);
    }
    return NextResponse.json({ ues });
  }
}
