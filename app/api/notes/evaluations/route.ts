import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSql, isNeonConfigured } from '@/lib/db/neon';
import { ensureAdminTablesExist } from '@/lib/db/schema-init';
import {
  getMockEvaluations,
  saveMockEvaluation,
  deleteMockEvaluation,
} from '@/lib/storage/notes-mock';

export const dynamic = 'force-dynamic';

// GET /api/notes/evaluations?ue_code=MBH1101
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ueCode = searchParams.get('ue_code');
  const email = session.user.email;

  // Si Neon n'est pas configuré, utiliser le stockage en mémoire
  if (!isNeonConfigured()) {
    const evaluations = getMockEvaluations(email, ueCode);
    return NextResponse.json({ evaluations });
  }

  try {
    await ensureAdminTablesExist();
    const sql = getSql();

    let evaluations;
    if (ueCode) {
      evaluations = await sql`
        SELECT ev.id, ev.ecu_id, ev.ue_code, ev.type, ev.grade, e.name AS ecu_name
        FROM evaluations ev
        LEFT JOIN ecus e ON e.id = ev.ecu_id
        WHERE LOWER(ev.student_email) = LOWER(${email})
          AND (ev.ue_code = ${ueCode} OR e.ue_code = ${ueCode});
      `;
    } else {
      evaluations = await sql`
        SELECT ev.id, ev.ecu_id, COALESCE(ev.ue_code, e.ue_code) AS ue_code, ev.type, ev.grade, e.name AS ecu_name
        FROM evaluations ev
        LEFT JOIN ecus e ON e.id = ev.ecu_id
        WHERE LOWER(ev.student_email) = LOWER(${email});
      `;
    }

    // Normaliser ue_code
    const normalized = evaluations.map((ev: any) => ({
      ...ev,
      ue_code: ev.ue_code || undefined,
    }));

    return NextResponse.json({ evaluations: normalized });
  } catch (error) {
    console.error('GET /api/notes/evaluations error:', error);
    const evaluations = getMockEvaluations(email, ueCode);
    return NextResponse.json({ evaluations });
  }
}

// POST /api/notes/evaluations  { ue_code, ecu_id?, type, grade }
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ue_code, ecu_id, type, grade } = body;

    if ((!ue_code && !ecu_id) || !type || !['CC', 'ET'].includes(type)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }
    if (grade !== null && grade !== undefined && (grade < 0 || grade > 20)) {
      return NextResponse.json({ error: 'La note doit être entre 0 et 20' }, { status: 400 });
    }

    const email = session.user.email;
    const effectiveUeCode = ue_code || '';
    const effectiveEcuId = ecu_id ? parseInt(String(ecu_id), 10) : null;

    if (!isNeonConfigured()) {
      saveMockEvaluation(email, effectiveUeCode, effectiveEcuId, type, grade ?? null);
      return NextResponse.json({ success: true });
    }

    await ensureAdminTablesExist();
    const sql = getSql();

    if (effectiveEcuId) {
      // Evaluation au niveau ECU
      await sql`
        INSERT INTO evaluations (student_email, ue_code, ecu_id, type, grade, updated_at)
        VALUES (${email}, ${effectiveUeCode || null}, ${effectiveEcuId}, ${type}, ${grade ?? null}, NOW())
        ON CONFLICT (student_email, ecu_id, type)
        DO UPDATE SET grade = ${grade ?? null}, updated_at = NOW();
      `;
    } else {
      // Evaluation directement au niveau UE
      // On vérifie d'abord si une ligne UE existe
      const existing = await sql`
        SELECT id FROM evaluations
        WHERE LOWER(student_email) = LOWER(${email})
          AND ue_code = ${effectiveUeCode}
          AND ecu_id IS NULL
          AND type = ${type}
        LIMIT 1;
      `;
      if (existing.length > 0) {
        await sql`
          UPDATE evaluations
          SET grade = ${grade ?? null}, updated_at = NOW()
          WHERE id = ${existing[0].id};
        `;
      } else {
        await sql`
          INSERT INTO evaluations (student_email, ue_code, ecu_id, type, grade, updated_at)
          VALUES (${email}, ${effectiveUeCode}, NULL, ${type}, ${grade ?? null}, NOW());
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/notes/evaluations error:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de l\'enregistrement' }, { status: 500 });
  }
}

// DELETE /api/notes/evaluations?ecu_id=5&type=CC ou ?ue_code=MBH1101&type=CC
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ecuId = searchParams.get('ecu_id');
    const ueCode = searchParams.get('ue_code');
    const type = searchParams.get('type');

    if ((!ecuId && !ueCode) || !type) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const email = session.user.email;

    if (!isNeonConfigured()) {
      deleteMockEvaluation(
        email,
        ueCode || '',
        ecuId ? parseInt(ecuId, 10) : null,
        type as 'CC' | 'ET'
      );
      return NextResponse.json({ success: true });
    }

    const sql = getSql();
    if (ecuId) {
      await sql`
        DELETE FROM evaluations
        WHERE LOWER(student_email) = LOWER(${email})
          AND ecu_id = ${ecuId}
          AND type = ${type};
      `;
    } else if (ueCode) {
      await sql`
        DELETE FROM evaluations
        WHERE LOWER(student_email) = LOWER(${email})
          AND ue_code = ${ueCode}
          AND ecu_id IS NULL
          AND type = ${type};
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notes/evaluations error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
