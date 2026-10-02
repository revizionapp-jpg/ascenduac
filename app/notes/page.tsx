'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { loginWithGoogleOrDemo } from '@/lib/auth-client';
import {
  BarChart3, BookOpen, ChevronRight, GraduationCap,
  TrendingUp, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import { EPAC_PASSING_GRADE, DEFAULT_CC_WEIGHT, DEFAULT_ET_WEIGHT, getUeTypeLabel, SemesterId, getFiliereFromSemester } from '@/lib/constants/curriculum';

interface Ecu {
  id: number;
  name: string;
}

interface Ue {
  code: string;
  name: string;
  credits: number;
  semester: string;
  type?: string;
  ecus: Ecu[];
}

interface Evaluation {
  id?: number;
  ecu_id?: number | null;
  ue_code?: string;
  type: 'CC' | 'ET';
  grade: number | null;
  ecu_name?: string;
}

const CC_WEIGHT = DEFAULT_CC_WEIGHT; // 0.50
const ET_WEIGHT = DEFAULT_ET_WEIGHT; // 0.50
const PASSING_GRADE = EPAC_PASSING_GRADE; // 12/20

function computeEcuGrade(ecuId: number, evals: Evaluation[]): number | null {
  const cc = evals.find(e => e.ecu_id === ecuId && e.type === 'CC');
  const et = evals.find(e => e.ecu_id === ecuId && e.type === 'ET');
  const hasCC = cc && cc.grade !== null && cc.grade !== undefined && !isNaN(cc.grade);
  const hasET = et && et.grade !== null && et.grade !== undefined && !isNaN(et.grade);
  if (!hasCC && !hasET) return null;
  const totalW = (hasCC ? CC_WEIGHT : 0) + (hasET ? ET_WEIGHT : 0);
  if (totalW === 0) return null;
  const sum = (hasCC ? cc!.grade! * CC_WEIGHT : 0) + (hasET ? et!.grade! * ET_WEIGHT : 0);
  return sum / totalW;
}

function computeUeAvg(ue: Ue, evals: Evaluation[]): number | null {
  // 1. Calcul via les ECUs individuels si des notes existent
  const ecuGrades = ue.ecus
    .map(e => computeEcuGrade(e.id, evals))
    .filter((g): g is number => g !== null);

  if (ecuGrades.length > 0) {
    return ecuGrades.reduce((s, g) => s + g, 0) / ecuGrades.length;
  }

  // 2. Sinon, calcul via la note saisie directement au niveau de l'UE
  const ueCc = evals.find(e => e.ue_code === ue.code && !e.ecu_id && e.type === 'CC');
  const ueEt = evals.find(e => e.ue_code === ue.code && !e.ecu_id && e.type === 'ET');
  const hasCC = ueCc && ueCc.grade !== null && ueCc.grade !== undefined && !isNaN(ueCc.grade);
  const hasET = ueEt && ueEt.grade !== null && ueEt.grade !== undefined && !isNaN(ueEt.grade);

  if (!hasCC && !hasET) return null;
  const totalW = (hasCC ? CC_WEIGHT : 0) + (hasET ? ET_WEIGHT : 0);
  if (totalW === 0) return null;
  return ((hasCC ? ueCc!.grade! * CC_WEIGHT : 0) + (hasET ? ueEt!.grade! * ET_WEIGHT : 0)) / totalW;
}

function GradeBar({ value, max = 20 }: { value: number | null; max?: number }) {
  const pct = value !== null ? Math.min(100, (value / max) * 100) : 0;
  const barClass =
    value === null
      ? 'bg-ink-muted/30'
      : value >= PASSING_GRADE
      ? 'bg-brand-600 dark:bg-brand-400'
      : value >= 10
      ? 'bg-accent-400'
      : 'bg-danger';

  return (
    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden flex-1 border border-surface-border/40">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function NotesPage() {
  const { data: session, status } = useSession();
  const [semester, setSemester] = useState<SemesterId>('1');
  const [ues, setUes] = useState<Ue[]>([]);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const filiere = getFiliereFromSemester(semester);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ueRes, evalRes] = await Promise.all([
        fetch(`/api/notes/ues?semester=${semester}`),
        session ? fetch('/api/notes/evaluations') : Promise.resolve(null),
      ]);
      const ueData = await ueRes.json();
      setUes(ueData.ues || []);
      if (evalRes && evalRes.ok) {
        const evalData = await evalRes.json();
        setEvals(evalData.evaluations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [semester, session]);

  useEffect(() => { loadData(); }, [loadData]);

  // Moyenne générale pondérée par les crédits de chaque UE évaluée
  const gradedUesWithCredits = ues
    .map(ue => ({ avg: computeUeAvg(ue, evals), credits: ue.credits }))
    .filter((item): item is { avg: number; credits: number } => item.avg !== null);

  const totalWeighted = gradedUesWithCredits.reduce((s, item) => s + item.avg * item.credits, 0);
  const totalGradedCredits = gradedUesWithCredits.reduce((s, item) => s + item.credits, 0);
  const globalAvg = totalGradedCredits > 0 ? totalWeighted / totalGradedCredits : null;
  const passedUes = gradedUesWithCredits.filter(g => g.avg >= PASSING_GRADE).length;
  const totalSemesterCredits = ues.reduce((acc, u) => acc + (u.credits || 0), 0);

  return (
    <div className="min-h-screen bg-surface-bg pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 py-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/15 dark:bg-black/20 rounded-xl p-2 border border-white/20">
              <BarChart3 className="text-accent-400 w-6 h-6" />
            </div>
            <span className="text-accent-400 font-bold text-xs uppercase tracking-widest">
              Suivi Académique {filiere} • EPAC / UAC
            </span>
          </div>

          <h1 className="text-white text-3xl sm:text-4xl font-black mb-2 tracking-tight">
            Mes Notes {filiere}
          </h1>
          <p className="text-brand-100 text-sm sm:text-base max-w-2xl leading-relaxed">
            Référentiel officiel {filiere} (Semestre {semester} • {totalSemesterCredits} crédits).
            Moyenne de passage EPAC : <strong className="text-white">{PASSING_GRADE}/20</strong> • Pondération par défaut : <strong className="text-white">CC 50% / ET 50%</strong>.
          </p>

          {/* Stats bar */}
          {session && (
            <div className="flex gap-3 sm:gap-4 mt-6 flex-wrap">
              {[
                { label: 'Moyenne générale pondérée', value: globalAvg !== null ? globalAvg.toFixed(2) + '/20' : '--', icon: <TrendingUp size={16} /> },
                { label: 'UEs validées (≥ 12/20)', value: `${passedUes} / ${gradedUesWithCredits.length}`, icon: <GraduationCap size={16} /> },
                { label: 'Crédits évalués', value: `${totalGradedCredits} / ${totalSemesterCredits} cr`, icon: <BookOpen size={16} /> },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-2xl py-3 px-4 sm:px-5 flex items-center gap-3 border border-white/15">
                  <span className="text-accent-400">{stat.icon}</span>
                  <div>
                    <div className="text-brand-100 text-[10px] font-bold uppercase tracking-wider">{stat.label}</div>
                    <div className="text-white font-extrabold text-base sm:text-lg">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Semester tabs */}
      <div className="max-w-5xl mx-auto -mt-6 px-4 sm:px-6 relative z-20">
        <div className="inline-flex bg-surface rounded-2xl p-1.5 shadow-subtle dark:shadow-none border border-surface-border gap-1.5">
          {([{id: '1', label: 'S1 MBH1 (MBH1101 - MBH1108)'}, {id: '2', label: 'S2 MBH1 (MBH1209 - MBH1216)'}, {id: '3', label: 'S3 MBH2 (MBH1317 - MBH1324)'}] as const).map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSemester(s.id)}
              className={`py-2 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                semester === s.id
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto mt-8 px-4 sm:px-6">
        {!session && status !== 'loading' ? (
          <div className="text-center py-12 px-6 bg-surface-card rounded-3xl shadow-subtle dark:shadow-none border border-surface-border">
            <AlertCircle className="text-accent-700 dark:text-accent-400 w-12 h-12 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink mb-2">Connexion requise</h2>
            <p className="text-sm text-ink-muted mb-6">Connecte-toi avec Google pour sauvegarder et simuler tes notes.</p>
            <button
              type="button"
              onClick={() => loginWithGoogleOrDemo('/notes')}
              className="bg-brand-700 hover:bg-brand-800 text-white border-none rounded-xl py-3 px-6 font-bold cursor-pointer inline-flex items-center gap-2 text-sm transition-all shadow-md shadow-brand/20"
            >
              <Sparkles size={18} className="text-accent-400" />
              <span>Se connecter</span>
            </button>
          </div>
        ) : loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface rounded-2xl p-6 h-48 animate-pulse border border-surface-border shadow-xs" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {ues.map((ue) => {
                const avg = computeUeAvg(ue, evals);
                const isPass = avg !== null && avg >= PASSING_GRADE;
                const isFail = avg !== null && avg < PASSING_GRADE;

                // Compter combien d'ECUs sont notés
                const gradedEcusCount = ue.ecus.filter(e => computeEcuGrade(e.id, evals) !== null).length;
                const hasUeDirectNote = evals.some(e => e.ue_code === ue.code && !e.ecu_id && e.grade !== null);

                return (
                  <Link
                    key={ue.code}
                    href={`/notes/ue/${ue.code}`}
                    className="block group"
                  >
                    <div className={`bg-surface-card rounded-2xl p-6 shadow-subtle dark:shadow-none border transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-card relative overflow-hidden flex flex-col justify-between h-full ${
                      isPass
                        ? 'border-brand-300 dark:border-brand-800/80 hover:border-brand-500'
                        : isFail
                        ? 'border-danger/30 dark:border-danger/40 hover:border-danger'
                        : 'border-surface-border hover:border-brand-500/50'
                    }`}>
                      {/* Top accent line */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        isPass ? 'bg-brand-600' : isFail ? 'bg-danger' : 'bg-surface-border'
                      }`} />

                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/40 rounded-md px-2 py-0.5 uppercase tracking-wide border border-brand-200 dark:border-brand-800/40">
                                {ue.code}
                              </span>
                              <span className="text-[11px] font-semibold text-ink-muted bg-surface-2 rounded-md px-2 py-0.5 border border-surface-border">
                                {ue.credits} crédits
                              </span>
                              {ue.type && (
                                <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 rounded-md px-2 py-0.5 border border-sky-200 dark:border-sky-800/40">
                                  {getUeTypeLabel(ue.type as any)}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-ink mt-2.5 leading-snug group-hover:text-brand-700 dark:group-hover:text-accent-400 transition-colors line-clamp-2">
                              {ue.name}
                            </h3>
                          </div>

                          <div className={`text-2xl font-black min-w-[56px] text-right leading-none shrink-0 ${
                            isPass ? 'text-brand-700 dark:text-accent-400' : isFail ? 'text-danger' : 'text-ink-muted'
                          }`}>
                            {avg !== null ? avg.toFixed(1) : '--'}
                            {avg !== null && <span className="text-[10px] text-ink-muted font-normal">/20</span>}
                          </div>
                        </div>

                        <div className="my-3">
                          <GradeBar value={avg} />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-surface-border/50 text-xs mt-2">
                        <span className="text-[11px] text-ink-muted">
                          {hasUeDirectNote
                            ? 'Note globale'
                            : `${gradedEcusCount}/${ue.ecus.length} ECU${ue.ecus.length > 1 ? 's' : ''}`}
                        </span>
                        <span className="text-xs text-brand-700 dark:text-accent-400 flex items-center gap-1 font-bold group-hover:underline">
                          Gérer <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {ues.length === 0 && (
              <div className="text-center py-16 text-ink-muted">
                <BookOpen size={48} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Aucune UE trouvée pour ce semestre.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
