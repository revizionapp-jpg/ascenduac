'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { loginWithGoogleOrDemo } from '@/lib/auth-client';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, BookOpen, Save, BarChart3, FileText,
  CheckCircle2, XCircle, AlertCircle, ExternalLink, Sparkles,
  Upload, Layers, Sliders
} from 'lucide-react';
import {
  EPAC_PASSING_GRADE,
  DEFAULT_CC_WEIGHT,
  DEFAULT_ET_WEIGHT,
  getUeTypeLabel
} from '@/lib/constants/curriculum';

interface Ecu { id: number; name: string; }
interface Ue { code: string; name: string; credits: number; semester: string; type?: string; ecus: Ecu[]; }
interface EvalMap { [ecuId: number]: { CC?: number; ET?: number } }
interface UeDirectEval { CC?: number; ET?: number }
interface Annale {
  id: string; titre: string; matiere_nom: string; niveau: string;
  annee_academique: string; type: string; cloudinary_url: string;
  ecu_nom?: string;
}

const CC_W = DEFAULT_CC_WEIGHT; // 0.50
const ET_W = DEFAULT_ET_WEIGHT; // 0.50
const PASS = EPAC_PASSING_GRADE; // 12/20

function computeEcuGrade(ecuId: number, evals: EvalMap): number | null {
  const cc = evals[ecuId]?.CC;
  const et = evals[ecuId]?.ET;
  const hasCC = cc !== undefined && cc !== null && !isNaN(cc);
  const hasET = et !== undefined && et !== null && !isNaN(et);
  if (!hasCC && !hasET) return null;
  const tw = (hasCC ? CC_W : 0) + (hasET ? ET_W : 0);
  if (tw === 0) return null;
  return ((hasCC ? cc! * CC_W : 0) + (hasET ? et! * ET_W : 0)) / tw;
}

function computeDirectGrade(direct: UeDirectEval): number | null {
  const hasCC = direct.CC !== undefined && direct.CC !== null && !isNaN(direct.CC);
  const hasET = direct.ET !== undefined && direct.ET !== null && !isNaN(direct.ET);
  if (!hasCC && !hasET) return null;
  const tw = (hasCC ? CC_W : 0) + (hasET ? ET_W : 0);
  if (tw === 0) return null;
  return ((hasCC ? direct.CC! * CC_W : 0) + (hasET ? direct.ET! * ET_W : 0)) / tw;
}

function GradeInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const num = value !== '' ? parseFloat(value) : null;
  const statusBorder =
    num === null
      ? 'border-surface-border'
      : num >= PASS
      ? 'border-brand-500 dark:border-brand-400'
      : num >= 10
      ? 'border-accent-400'
      : 'border-danger';

  const textColor =
    num === null
      ? 'text-ink'
      : num >= PASS
      ? 'text-brand-700 dark:text-accent-400 font-bold'
      : num >= 10
      ? 'text-accent-700 dark:text-accent-400 font-bold'
      : 'text-danger font-bold';

  return (
    <div className="flex-1 min-w-[130px]">
      <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          min="0"
          max="20"
          step="0.25"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="--"
          className={`w-full py-2.5 pr-10 pl-3.5 rounded-xl border bg-surface ${statusBorder} ${textColor} text-sm font-semibold outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 transition-all`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted font-semibold pointer-events-none">
          /20
        </span>
      </div>
    </div>
  );
}

export default function UePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const code = params.code as string;

  const [ue, setUe] = useState<Ue | null>(null);
  const [entryMode, setEntryMode] = useState<'ecu' | 'ue'>('ecu');

  // Notes par ECU
  const [evals, setEvals] = useState<EvalMap>({});
  const [drafts, setDrafts] = useState<{ [ecuId: number]: { CC: string; ET: string } }>({});

  // Note globale directe UE
  const [ueDirectEval, setUeDirectEval] = useState<UeDirectEval>({});
  const [ueDrafts, setUeDrafts] = useState<{ CC: string; ET: string }>({ CC: '', ET: '' });

  const [annales, setAnnales] = useState<Annale[]>([]);
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [saved, setSaved] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const ueRes = await fetch('/api/notes/ues');
      const ueData = await ueRes.json();
      const foundUe = (ueData.ues || []).find((u: Ue) => u.code === code);
      setUe(foundUe || null);

      if (foundUe) {
        // Charger les annales pour cette matière
        try {
          const annalesRes = await fetch(`/api/epreuves?matiere=${encodeURIComponent(foundUe.name)}&limit=8`);
          if (annalesRes.ok) {
            const annalesData = await annalesRes.json();
            setAnnales(annalesData.epreuves || []);
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (session) {
        const evalRes = await fetch('/api/notes/evaluations?ue_code=' + code);
        if (evalRes.ok) {
          const evalData = await evalRes.json();
          const map: EvalMap = {};
          const draftMap: { [ecuId: number]: { CC: string; ET: string } } = {};
          const directMap: UeDirectEval = {};
          const directDrafts: { CC: string; ET: string } = { CC: '', ET: '' };

          let hasEcuNotes = false;
          let hasUeDirect = false;

          for (const e of evalData.evaluations || []) {
            if (e.ecu_id) {
              hasEcuNotes = true;
              if (!map[e.ecu_id]) map[e.ecu_id] = {};
              if (e.grade !== null) map[e.ecu_id][e.type as 'CC' | 'ET'] = e.grade;
              if (!draftMap[e.ecu_id]) draftMap[e.ecu_id] = { CC: '', ET: '' };
              if (e.grade !== null) draftMap[e.ecu_id][e.type as 'CC' | 'ET'] = String(e.grade);
            } else if (e.ue_code === code) {
              hasUeDirect = true;
              if (e.grade !== null) directMap[e.type as 'CC' | 'ET'] = e.grade;
              if (e.grade !== null) directDrafts[e.type as 'CC' | 'ET'] = String(e.grade);
            }
          }

          setEvals(map);
          setDrafts(draftMap);
          setUeDirectEval(directMap);
          setUeDrafts(directDrafts);

          if (hasUeDirect && !hasEcuNotes) {
            setEntryMode('ue');
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [code, session]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDraftChange = (ecuId: number, type: 'CC' | 'ET', val: string) => {
    setDrafts(d => ({ ...d, [ecuId]: { ...(d[ecuId] || { CC: '', ET: '' }), [type]: val } }));
  };

  const handleUeDraftChange = (type: 'CC' | 'ET', val: string) => {
    setUeDrafts(d => ({ ...d, [type]: val }));
  };

  const saveGrade = async (ecuId: number, type: 'CC' | 'ET') => {
    const key = ecuId + '-' + type;
    const val = drafts[ecuId]?.[type];
    const grade = val !== '' && val !== undefined ? parseFloat(val) : null;
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await fetch('/api/notes/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ue_code: code, ecu_id: ecuId, type, grade }),
      });
      setEvals(ev => ({ ...ev, [ecuId]: { ...(ev[ecuId] || {}), [type]: grade !== null ? grade : undefined } }));
      setSaved(s => ({ ...s, [key]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(s => ({ ...s, [key]: false })); }
  };

  const saveUeDirect = async (type: 'CC' | 'ET') => {
    const key = 'ue-' + type;
    const val = ueDrafts[type];
    const grade = val !== '' && val !== undefined ? parseFloat(val) : null;
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await fetch('/api/notes/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ue_code: code, type, grade }),
      });
      setUeDirectEval(d => ({ ...d, [type]: grade !== null ? grade : undefined }));
      setSaved(s => ({ ...s, [key]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(s => ({ ...s, [key]: false })); }
  };

  const saveAll = async () => {
    if (!ue) return;
    if (entryMode === 'ecu') {
      for (const ecu of ue.ecus) {
        await saveGrade(ecu.id, 'CC');
        await saveGrade(ecu.id, 'ET');
      }
    } else {
      await saveUeDirect('CC');
      await saveUeDirect('ET');
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-surface-border border-t-brand-700 rounded-full mx-auto mb-4 animate-spin" />
        <p className="text-sm font-semibold text-ink-muted">Chargement de l&apos;Unité d&apos;Enseignement...</p>
      </div>
    </div>
  );

  if (!ue) return (
    <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
      <AlertCircle className="w-12 h-12 text-ink-muted" />
      <p className="text-sm text-ink-muted">UE introuvable : {code}</p>
      <Link href="/notes" className="text-brand-700 dark:text-accent-400 font-bold text-sm hover:underline">
        Retour aux notes
      </Link>
    </div>
  );

  // Calcul de la moyenne de l'UE
  const ecuGrades = ue.ecus.map(e => ({ ecu: e, grade: computeEcuGrade(e.id, evals) }));
  const gradedEcus = ecuGrades.filter(eg => eg.grade !== null);
  const directAvg = computeDirectGrade(ueDirectEval);

  let ueAvg: number | null = null;
  if (entryMode === 'ecu') {
    ueAvg = gradedEcus.length > 0 ? gradedEcus.reduce((s, eg) => s + eg.grade!, 0) / gradedEcus.length : null;
  } else {
    ueAvg = directAvg;
  }

  // Fallback si pas de note dans le mode actif mais présente dans l'autre
  if (ueAvg === null) {
    if (entryMode === 'ecu' && directAvg !== null) ueAvg = directAvg;
    else if (entryMode === 'ue' && gradedEcus.length > 0) {
      ueAvg = gradedEcus.reduce((s, eg) => s + eg.grade!, 0) / gradedEcus.length;
    }
  }

  const isPass = ueAvg !== null && ueAvg >= PASS;
  const isFail = ueAvg !== null && ueAvg < PASS;

  return (
    <div className="min-h-screen bg-surface-bg pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 py-10 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 text-brand-100 hover:text-white text-xs sm:text-sm font-semibold mb-5 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Retour à mes notes</span>
          </Link>

          <div className="flex justify-between items-start flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="bg-white/20 text-brand-50 rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide">
                  {ue.code}
                </span>
                <span className="bg-white/15 text-white rounded-lg px-2.5 py-0.5 text-xs font-semibold">
                  {ue.credits} crédits
                </span>
                <span className="bg-white/15 text-brand-100 rounded-lg px-2.5 py-0.5 text-xs font-medium">
                  Semestre {ue.semester}
                </span>
                {ue.type && (
                  <span className="bg-white/20 text-accent-400 rounded-lg px-2.5 py-0.5 text-xs font-bold">
                    {getUeTypeLabel(ue.type as any)}
                  </span>
                )}
              </div>
              <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                {ue.name}
              </h1>
              <p className="text-brand-100 text-xs sm:text-sm mt-2">
                Moyenne de validation EPAC : <strong className="text-white">{PASS}/20</strong> • Formule : <strong className="text-white">50% CC + 50% ET</strong>
              </p>
            </div>

            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-2xl p-5 text-center border border-white/20 min-w-[140px] shadow-sm">
              <div className="text-brand-100 text-[10px] font-bold uppercase tracking-widest">Moyenne UE</div>
              <div className={`text-3xl sm:text-4xl font-black my-1 leading-none ${
                ueAvg === null ? 'text-ink-muted' : isPass ? 'text-accent-400' : 'text-danger'
              }`}>
                {ueAvg !== null ? ueAvg.toFixed(2) : '--'}
              </div>
              <div className={`text-xs font-bold mt-1 ${isPass ? 'text-accent-400' : isFail ? 'text-danger' : 'text-brand-100'}`}>
                {isPass ? 'Validée (≥ 12/20)' : isFail ? 'À améliorer (< 12/20)' : 'Non notée'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {!session && status !== 'loading' && (
          <div className="bg-accent-100/60 dark:bg-accent-400/10 border border-accent-400/30 rounded-2xl p-4 flex items-center gap-4 mt-6 flex-wrap">
            <AlertCircle className="text-accent-700 dark:text-accent-400 shrink-0 w-5 h-5" />
            <p className="text-xs sm:text-sm text-ink font-semibold flex-1">
              Connecte-toi avec ton compte étudiant pour enregistrer tes notes.
            </p>
            <button
              type="button"
              onClick={() => loginWithGoogleOrDemo('/notes/ue/' + code)}
              className="bg-brand-700 hover:bg-brand-800 text-white rounded-xl py-2 px-4 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Sparkles size={14} className="text-accent-400" />
              <span>Se connecter</span>
            </button>
          </div>
        )}

        {/* Mode de saisie : Par ECU ou Directe UE */}
        <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
          <div className="inline-flex bg-surface rounded-xl p-1 border border-surface-border shadow-xs gap-1">
            <button
              type="button"
              onClick={() => setEntryMode('ecu')}
              className={`py-1.5 px-3.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                entryMode === 'ecu'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              <Layers size={14} />
              <span>Saisie par ECU ({ue.ecus.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('ue')}
              className={`py-1.5 px-3.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                entryMode === 'ue'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              <Sliders size={14} />
              <span>Saisie globale UE</span>
            </button>
          </div>

          {session && (
            <button
              type="button"
              onClick={saveAll}
              className="bg-brand-700 hover:bg-brand-800 text-white rounded-xl py-2 px-5 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-brand/20 active:scale-98"
            >
              <Save size={15} className="text-accent-400" />
              <span>Tout enregistrer</span>
            </button>
          )}
        </div>

        {/* ── Mode 1 : Saisie détaillée par ECU ── */}
        {entryMode === 'ecu' && (
          <div className="flex flex-col gap-3.5 mt-5">
            {ue.ecus.map((ecu, idx) => {
              const grade = computeEcuGrade(ecu.id, evals);
              const isEcuPass = grade !== null && grade >= PASS;
              const isEcuFail = grade !== null && grade < PASS;

              return (
                <div
                  key={ecu.id}
                  className={`bg-surface-card rounded-2xl p-5 shadow-subtle dark:shadow-none border transition-all ${
                    isEcuPass
                      ? 'border-brand-300 dark:border-brand-800/80'
                      : isEcuFail
                      ? 'border-danger/30 dark:border-danger/40'
                      : 'border-surface-border'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/40 rounded-md px-2 py-0.5 uppercase tracking-wide border border-brand-200 dark:border-brand-800/40">
                        ECU {idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-ink mt-1.5">{ecu.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {grade !== null && (
                        <span className={`font-black text-base ${isEcuPass ? 'text-brand-700 dark:text-accent-400' : 'text-danger'}`}>
                          {grade.toFixed(2)}/20
                        </span>
                      )}
                      {isEcuPass && <CheckCircle2 className="text-brand-600 dark:text-brand-400 w-4 h-4" />}
                      {isEcuFail && <XCircle className="text-danger w-4 h-4" />}
                    </div>
                  </div>

                  <div className="flex gap-3 items-end flex-wrap">
                    <GradeInput
                      label="Contrôle Continu (CC - 50%)"
                      value={drafts[ecu.id]?.CC !== undefined ? drafts[ecu.id].CC : (evals[ecu.id]?.CC !== undefined ? String(evals[ecu.id].CC) : '')}
                      onChange={v => handleDraftChange(ecu.id, 'CC', v)}
                    />
                    <GradeInput
                      label="Examen Terminal (ET - 50%)"
                      value={drafts[ecu.id]?.ET !== undefined ? drafts[ecu.id].ET : (evals[ecu.id]?.ET !== undefined ? String(evals[ecu.id].ET) : '')}
                      onChange={v => handleDraftChange(ecu.id, 'ET', v)}
                    />
                    {session && (
                      <button
                        type="button"
                        onClick={() => { saveGrade(ecu.id, 'CC'); saveGrade(ecu.id, 'ET'); }}
                        className={`rounded-xl py-2.5 px-4 font-bold text-xs whitespace-nowrap self-end flex items-center gap-1.5 transition-all shadow-xs ${
                          saved[ecu.id + '-CC'] || saved[ecu.id + '-ET']
                            ? 'bg-brand-50 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 border border-brand-200 dark:border-brand-800'
                            : 'bg-brand-700 hover:bg-brand-800 text-white'
                        }`}
                      >
                        {(saved[ecu.id + '-CC'] || saved[ecu.id + '-ET']) ? 'Enregistré !' : 'Sauvegarder'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Mode 2 : Saisie globale directe de l'UE ── */}
        {entryMode === 'ue' && (
          <div className="bg-surface-card rounded-2xl p-6 shadow-subtle dark:shadow-none border border-surface-border mt-5">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 rounded-md px-2 py-0.5 uppercase tracking-wide border border-sky-200 dark:border-sky-800/40">
                Note Globale UE
              </span>
              <h3 className="text-base font-bold text-ink mt-2">
                Saisie directe sans distinction d&apos;ECU
              </h3>
              <p className="text-xs text-ink-muted mt-1">
                Utilisez cette option si vous avez reçu une note unique pour toute l&apos;Unité d&apos;Enseignement.
              </p>
            </div>

            <div className="flex gap-3 items-end flex-wrap">
              <GradeInput
                label="CC Global UE (50%)"
                value={ueDrafts.CC !== '' ? ueDrafts.CC : (ueDirectEval.CC !== undefined ? String(ueDirectEval.CC) : '')}
                onChange={v => handleUeDraftChange('CC', v)}
              />
              <GradeInput
                label="ET Global UE (50%)"
                value={ueDrafts.ET !== '' ? ueDrafts.ET : (ueDirectEval.ET !== undefined ? String(ueDirectEval.ET) : '')}
                onChange={v => handleUeDraftChange('ET', v)}
              />
              {session && (
                <button
                  type="button"
                  onClick={() => { saveUeDirect('CC'); saveUeDirect('ET'); }}
                  className={`rounded-xl py-2.5 px-4 font-bold text-xs whitespace-nowrap self-end flex items-center gap-1.5 transition-all shadow-xs ${
                    saved['ue-CC'] || saved['ue-ET']
                      ? 'bg-brand-50 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 border border-brand-200 dark:border-brand-800'
                      : 'bg-brand-700 hover:bg-brand-800 text-white'
                  }`}
                >
                  {(saved['ue-CC'] || saved['ue-ET']) ? 'Enregistré !' : 'Sauvegarder'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Section Annales de l'UE ── */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-800 rounded-xl p-2">
                <FileText className="text-brand-700 dark:text-accent-400 w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-ink">
                  Annales pour {ue.name}
                </h2>
                <p className="text-xs text-ink-muted">
                  Épreuves d&apos;examens et devoirs rattachés à {ue.code}
                </p>
              </div>
            </div>

            <Link
              href="/deposer"
              className="inline-flex items-center gap-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 border border-brand-200 dark:border-brand-800/40 rounded-xl py-2 px-3.5 text-xs font-bold hover:bg-brand-100 transition-colors"
            >
              <Upload size={14} className="text-brand-700 dark:text-accent-400" />
              <span>Déposer une épreuve</span>
            </Link>
          </div>

          {annales.length > 0 ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {annales.map(a => (
                <Link key={a.id} href={`/epreuves/${a.id}`} className="block group">
                  <div className="bg-surface-card rounded-xl p-4 border border-surface-border shadow-subtle dark:shadow-none flex gap-3 hover:border-brand-500/50 transition-all">
                    <div className="bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-800 rounded-lg p-2 flex-shrink-0 h-fit">
                      <BookOpen className="text-brand-700 dark:text-accent-400 w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-ink mb-1 truncate group-hover:text-brand-700 dark:group-hover:text-accent-400 transition-colors">
                        {a.titre || a.matiere_nom}
                      </p>
                      {a.ecu_nom && (
                        <span className="inline-block text-[10px] font-semibold text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/40 rounded px-1.5 py-0.2 mb-1 border border-brand-200 dark:border-brand-800/40">
                          ECU : {a.ecu_nom}
                        </span>
                      )}
                      <p className="text-[11px] text-ink-muted">{a.annee_academique} • <span className="capitalize">{a.type}</span></p>
                    </div>
                    <ExternalLink className="text-ink-muted w-3.5 h-3.5 flex-shrink-0 self-center group-hover:text-brand-700" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-2xl p-8 text-center border border-dashed border-surface-border">
              <BookOpen size={36} className="text-ink-muted mx-auto mb-2 opacity-50" />
              <p className="text-ink text-sm font-semibold">Aucune annale encore déposée pour {ue.code}.</p>
              <p className="text-ink-muted text-xs mt-1">Soyez le premier à partager une épreuve pour vos camarades.</p>
            </div>
          )}

          <div className="text-center mt-6">
            <Link
              href="/epreuves"
              className="text-brand-700 dark:text-accent-400 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 hover:underline"
            >
              <BarChart3 size={14} />
              <span>Voir tout le catalogue d&apos;épreuves</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}