'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRight, Loader2, Sparkles, Check, Award } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { VALID_NIVEAUX_PREDEFINIS } from '@/lib/utils/validation';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customNiveau, setCustomNiveau] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Vérifier si l'utilisateur a déjà un profil rempli
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profil')
        .then((res) => res.json())
        .then((data) => {
          if (data.profil?.niveau) {
            const niv = data.profil.niveau;
            if (VALID_NIVEAUX_PREDEFINIS.includes(niv)) {
              setSelectedOption(niv);
            } else {
              setSelectedOption('Autre');
              setCustomNiveau(niv);
            }
          }
        })
        .catch((err) => console.error(err));
    }
  }, [status]);

  const isOther = selectedOption === 'Autre';
  const effectiveNiveau = isOther ? customNiveau.trim() : selectedOption;
  const isValid = effectiveNiveau.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await fetch('/api/profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niveau: effectiveNiveau }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de l\'enregistrement');
      }

      // Redirection vers /epreuves avec filtre par défaut
      router.push(`/epreuves?niveau=${encodeURIComponent(effectiveNiveau)}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible d\'enregistrer votre niveau. Réessayez.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-between selection:bg-brand-700 selection:text-white">
      {/* Barre supérieure */}
      <header className="w-full max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/epreuves" className="flex items-center gap-2.5 group">
          <Logo />
        </Link>
      </header>

      {/* Contenu onboarding */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-10 shadow-subtle dark:shadow-none">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-accent-400 flex items-center justify-center mb-6 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
            Bienvenue {session?.user?.name ? `${session.user.name.split(' ')[0]} !` : 'en MBH !'}
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
            Pour personnaliser votre catalogue et afficher directement les épreuves qui vous concernent, quel est votre niveau actuel à l&apos;EPAC ?
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* Grille de sélection tactile des niveaux */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                Sélectionnez votre niveau <span className="text-danger">*</span>
              </label>

              <div className="grid grid-cols-1 gap-3">
                {VALID_NIVEAUX_PREDEFINIS.map((opt) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-700 dark:border-accent-400 bg-brand-50 dark:bg-brand-900/40 text-brand-900 dark:text-brand-100 shadow-sm font-bold scale-[1.01]'
                          : 'border-surface-border hover:border-brand-500/50 bg-surface hover:bg-surface-2 text-ink font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Award className={`w-5 h-5 ${isSelected ? 'text-brand-700 dark:text-accent-400' : 'text-ink-muted'}`} />
                        <div>
                          <span className="text-sm font-bold block">{opt}</span>
                          <span className="text-xs text-ink-muted font-normal">Filière Maintenance Biomédicale &amp; Hospitalière</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-brand-700 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-danger-50 dark:bg-danger/10 border border-danger/30 text-danger text-xs rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full mt-6 flex items-center justify-center gap-2.5 px-6 py-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-99"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <span>Accéder à mes épreuves</span>
                  <ArrowRight className="w-4 h-4 text-accent-400" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-ink-muted">
        Ce choix pourra être modifié à tout moment depuis votre profil.
      </footer>
    </div>
  );
}
