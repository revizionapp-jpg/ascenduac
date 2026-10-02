'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { loginWithGoogleOrDemo } from '@/lib/auth-client';
import {
  Search,
  UploadCloud,
  Users,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Award,
  Star,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Activity,
  Download,
  CheckCircle2,
  Layers,
  FileCheck,
  LogIn,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

const GoogleIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
  </svg>
);

/* ── Hook: intersection observer for scroll-reveal ── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Animated counter ── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const { ref, visible } = useReveal(0.3);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 35);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function LandingContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackFromUrl = searchParams.get('callbackUrl') || '/epreuves';
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Rotating words
  const rotatingWords = ['devoirs surveillés', 'examens officiels', 'sessions de rattrapage', 'corrigés & barèmes'];
  const [wordIndex, setWordIndex] = useState(0);
  const [fadeState, setFadeState] = useState('opacity-100 translate-y-0');

  // Parallax mouse effect
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('opacity-0 -translate-y-3 transition-all duration-300');
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setFadeState('opacity-0 translate-y-3');
        setTimeout(() => setFadeState('opacity-100 translate-y-0 transition-all duration-500'), 60);
      }, 300);
    }, 3200);
    return () => clearInterval(interval);
  }, [rotatingWords.length]);

  const handleGoogleLogin = (callbackPath?: string) => {
    setIsLoggingIn(true);
    loginWithGoogleOrDemo(callbackPath || callbackFromUrl);
  };

  const toggleFaq = (index: number) => setOpenFaqIndex(openFaqIndex === index ? null : index);
  const isAuthenticated = status === 'authenticated';

  // Reveal hooks for sections
  const heroReveal = useReveal(0.05);
  const statsReveal = useReveal(0.2);
  const featuresReveal = useReveal(0.15);
  const howReveal = useReveal(0.15);
  const whyReveal = useReveal(0.15);
  const matiereReveal = useReveal(0.15);
  const faqReveal = useReveal(0.15);
  const ctaReveal = useReveal(0.2);

  return (
    <div className="relative min-h-screen flex flex-col bg-surface-bg text-ink font-sans overflow-x-hidden selection:bg-brand-700 selection:text-white">

      {/* ── Inline CSS for custom animations ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-18px)} }
        @keyframes float-delayed { 0%,100%{transform:translateY(0px) rotate(0deg)} 33%{transform:translateY(-12px) rotate(5deg)} 66%{transform:translateY(-20px) rotate(-3deg)} }
        @keyframes float-slow { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-10px) rotate(8deg)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes gradient-shift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 9s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-gradient { background-size:200% 200%; animation: gradient-shift 6s ease infinite; }
        .reveal-up { opacity:0; transform:translateY(40px); transition:all 0.7s cubic-bezier(0.22,1,0.36,1); }
        .reveal-up.visible { opacity:1; transform:translateY(0); }
        .reveal-scale { opacity:0; transform:scale(0.94); transition:all 0.6s cubic-bezier(0.22,1,0.36,1); }
        .reveal-scale.visible { opacity:1; transform:scale(1); }
        .card-hover { transition: all 0.35s cubic-bezier(0.22,1,0.36,1); }
        .card-hover:hover { transform: translateY(-4px); }
      ` }} />

      {/* ── BACKGROUND: Ambient orbs + grid ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-40 dark:opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(31,122,58,0.15) 0%, transparent 70%)',
            transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -20}px)`,
            transition: 'transform 0.8s ease-out',
          }}
        />
        <div
          className="absolute top-[30%] -right-32 w-[700px] h-[700px] rounded-full opacity-35 dark:opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(246,208,47,0.12) 0%, transparent 70%)',
            transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 15}px)`,
            transition: 'transform 1s ease-out',
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        {/* Floating icons with parallax */}
        <div style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -15}px)`, transition: 'transform 1s ease-out' }}>
          <BookOpen className="absolute top-[18%] left-[7%] h-14 w-14 text-brand-700/10 dark:text-accent-400/10 animate-float hidden lg:block" />
        </div>
        <div style={{ transform: `translate(${mousePos.x * 18}px, ${mousePos.y * 12}px)`, transition: 'transform 0.9s ease-out' }}>
          <GraduationCap className="absolute top-[22%] right-[8%] h-18 w-18 text-brand-700/10 dark:text-brand-300/10 animate-float-delayed hidden lg:block" />
        </div>
        <div style={{ transform: `translate(${mousePos.x * -12}px, ${mousePos.y * 20}px)`, transition: 'transform 1.1s ease-out' }}>
          <Award className="absolute bottom-[30%] left-[9%] h-16 w-16 text-accent-400/15 animate-float-slow hidden lg:block" />
        </div>
        <div style={{ transform: `translate(${mousePos.x * 22}px, ${mousePos.y * -18}px)`, transition: 'transform 0.8s ease-out' }}>
          <Activity className="absolute bottom-[40%] right-[11%] h-14 w-14 text-brand-700/10 animate-float hidden lg:block" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          1. HEADER
      ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-surface/85 backdrop-blur-xl transition-all shadow-subtle dark:shadow-none">
        <div className="max-w-6xl mx-auto flex h-16 sm:h-18 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Logo />
          </Link>

          {/* Centre : Nav links (desktop uniquement, si connecté) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 bg-surface-2 px-2 py-1.5 rounded-full border border-surface-border">
              <Link href="/epreuves" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-surface transition-colors">
                <BookOpen className="w-4 h-4" />
                Épreuves
              </Link>
              <Link href="/deposer" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-surface transition-colors">
                <UploadCloud className="w-4 h-4" />
                Déposer
              </Link>
              <Link href="/mes-depots" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-surface transition-colors">
                <Download className="w-4 h-4" />
                Mes dépôts
              </Link>
              <Link href="/notes" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-surface transition-colors">
                <Activity className="w-4 h-4" />
                Mes Notes
              </Link>
            </nav>
          )}

          {/* Droite : CTA + ThemeToggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link
                href="/epreuves"
                className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-brand-700 hover:bg-brand-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand/20 transition-all"
              >
                <span>Mon espace</span>
                <ArrowRight className="h-3.5 w-3.5 text-accent-400" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => handleGoogleLogin('/epreuves')}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-5 rounded-full bg-brand-700 hover:bg-brand-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand/20 active:scale-95 transition-all"
              >
                <GoogleIcon className="w-4 h-4 bg-white p-0.5 rounded-full" />
                <span>{isLoggingIn ? 'Connexion...' : 'Connexion Google'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative">

        {/* ═══════════════════════════════════════════════════════
            2. HERO — Dynamique & Immersif
        ═══════════════════════════════════════════════════════ */}
        <section className="relative px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center overflow-hidden">
          <div
            ref={heroReveal.ref}
            className={`max-w-4xl mx-auto flex flex-col items-center relative z-10 reveal-up ${heroReveal.visible ? 'visible' : ''}`}
          >
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 dark:bg-accent-400/15 border border-accent-400/40 rounded-full text-xs sm:text-sm font-bold text-brand-900 dark:text-accent-400 mb-8 shadow-xs cursor-default">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-400"></span>
              </span>
              <span>Plateforme officielle d&apos;annales • Filière MBH (EPAC / UAC)</span>
              <Sparkles className="h-3.5 w-3.5 text-brand-700 dark:text-accent-400" />
            </div>

            {/* Titre principal avec mot rotatif */}
            <h1 className="font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-ink mb-6 leading-[1.12] tracking-tight max-w-3xl">
              Révise avec tous les{' '}
              <span className="relative inline-flex flex-col items-center">
                <span className="inline-block text-brand-700 dark:text-accent-400">
                  <span className={`inline-block ${fadeState}`} style={{ transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
                    {rotatingWords[wordIndex]}
                  </span>
                </span>
                {/* Soulignement SVG animé */}
                <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-3 sm:h-4" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                  <path d="M2 9C70 3 180 2 298 7" stroke="url(#heroUnderline)" strokeWidth="3.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="heroUnderline" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1F7A3A" />
                      <stop offset="50%" stopColor="#F6D02F" />
                      <stop offset="100%" stopColor="#1F7A3A" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br className="hidden sm:block" />
              <span className="text-ink"> de la filière MBH.</span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-ink-muted mb-10 max-w-2xl leading-relaxed font-normal">
              Fini les photos floues sur WhatsApp et les clés USB perdues. Connecte-toi avec Google pour consulter et télécharger les annales officielles de la 1ère à la 3ème année.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto mb-6">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/epreuves"
                    className="inline-flex items-center justify-center gap-2.5 h-13 sm:h-14 px-8 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-base font-bold shadow-md shadow-brand/20 active:scale-95 transition-all group"
                  >
                    <span>Accéder aux annales</span>
                    <ArrowRight className="h-5 w-5 text-accent-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/deposer"
                    className="inline-flex items-center justify-center gap-2.5 h-13 sm:h-14 px-7 rounded-2xl bg-surface border-2 border-surface-border text-ink text-base font-semibold hover:border-brand-500/50 hover:bg-surface-2 active:scale-95 transition-all"
                  >
                    <UploadCloud className="h-5 w-5 text-brand-700 dark:text-accent-400" />
                    <span>Déposer une épreuve</span>
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin('/epreuves')}
                    disabled={isLoggingIn}
                    className="inline-flex items-center justify-center gap-3 h-13 sm:h-14 px-8 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-base font-bold shadow-md shadow-brand/20 active:scale-95 transition-all group cursor-pointer"
                  >
                    <GoogleIcon className="w-5 h-5 bg-white p-0.5 rounded-full" />
                    <span>{isLoggingIn ? 'Connexion en cours...' : 'Se connecter avec Google'}</span>
                    <ArrowRight className="h-4 w-4 text-accent-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin('/deposer')}
                    disabled={isLoggingIn}
                    className="inline-flex items-center justify-center gap-2.5 h-13 sm:h-14 px-7 rounded-2xl bg-surface border-2 border-surface-border text-ink text-base font-semibold hover:border-brand-500/50 hover:bg-surface-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <UploadCloud className="h-5 w-5 text-brand-700 dark:text-accent-400" />
                    <span>Déposer une épreuve</span>
                  </button>
                </>
              )}
            </div>

            {/* Trust signal */}
            <p className="text-xs text-ink-muted font-medium mb-10">
              Gratuit · Aucune carte bancaire · Connexion sécurisée Google
            </p>

            {/* Social proof */}
            <div className="flex flex-col items-center gap-3 pt-6 border-t border-surface-border w-full max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {[
                    ['KM', 'bg-brand-700'],
                    ['AB', 'bg-teal-700'],
                    ['UO', 'bg-brand-800'],
                    ['SD', 'bg-accent-700'],
                    ['ML', 'bg-brand-900'],
                  ].map(([initials, bg]) => (
                    <div key={initials} className={`w-8 h-8 rounded-full border-2 border-surface ${bg} flex items-center justify-center text-[10px] font-bold text-white shadow-xs`}>
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="flex text-accent-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <span className="text-sm font-bold text-ink">4.9/5</span>
              </div>
              <p className="text-xs sm:text-sm text-ink-muted font-medium text-center">
                Recommandé par les étudiants MBH de l&apos;EPAC
              </p>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40 animate-bounce">
            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest">Défiler</span>
            <ChevronDown className="w-4 h-4 text-ink-muted" />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            3. STATS ANIMÉES
        ═══════════════════════════════════════════════════════ */}
        <section className="px-4 py-12 relative z-10 bg-brand-800 text-white">
          <div
            ref={statsReveal.ref}
            className={`max-w-6xl mx-auto relative z-10 reveal-up ${statsReveal.visible ? 'visible' : ''}`}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <BookOpen className="w-6 h-6" />, value: 20, suffix: '+', label: 'Matières répertoriées', color: 'text-accent-400' },
                { icon: <GraduationCap className="w-6 h-6" />, value: 3, suffix: '', label: 'Niveaux (L1 à L3 MBH)', color: 'text-white' },
                { icon: <FileCheck className="w-6 h-6" />, value: 100, suffix: '%', label: 'Contenu vérifié', color: 'text-accent-400' },
                { icon: <Download className="w-6 h-6" />, value: 0, suffix: ' FCFA', label: 'Accès 100% gratuit', color: 'text-white' },
              ].map(({ icon, value, suffix, label, color }, i) => (
                <div key={i} className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                  <div className={`w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3 ${color}`}>
                    {icon}
                  </div>
                  <div className={`text-3xl font-black ${color}`}>
                    <Counter target={value} suffix={suffix} />
                  </div>
                  <div className="text-xs font-medium text-white/80 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            4. APERÇU CATALOGUE (Features split)
        ═══════════════════════════════════════════════════════ */}
        <section className="px-4 py-20 bg-surface-bg relative z-10">
          <div
            ref={featuresReveal.ref}
            className={`max-w-6xl mx-auto reveal-up ${featuresReveal.visible ? 'visible' : ''}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Texte */}
              <div className="lg:col-span-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 text-xs font-bold uppercase tracking-wider mb-5 border border-brand-200 dark:border-brand-800/40">
                  <Layers className="w-3.5 h-3.5 text-brand-700 dark:text-accent-400" />
                  Base de connaissances centralisée
                </div>
                <h2 className="font-black text-3xl sm:text-4xl text-ink leading-tight mb-5">
                  Trouve ton épreuve en{' '}
                  <span className="text-brand-700 dark:text-accent-400">10 secondes</span>.
                </h2>
                <p className="text-ink-muted text-base leading-relaxed mb-7">
                  Recherche par mot-clé, filtre par promotion et isole les devoirs surveillés ou rattrapages. Chaque sujet est numérisé et directement consultable.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    'PDF haute définition lisibles sur smartphone ou ordinateur.',
                    'Indication claire des corrigés et barèmes disponibles.',
                    'Téléchargement direct et immédiat après connexion Google.',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-900/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-700 dark:text-accent-400" />
                      </div>
                      <span className="text-sm font-medium text-ink">{text}</span>
                    </div>
                  ))}
                </div>

                {isAuthenticated ? (
                  <Link href="/epreuves" className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold shadow-md shadow-brand/20 transition-all group">
                    <span>Explorer le catalogue</span>
                    <ArrowRight className="w-4 h-4 text-accent-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <button type="button" onClick={() => handleGoogleLogin('/epreuves')} disabled={isLoggingIn}
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold shadow-md shadow-brand/20 transition-all cursor-pointer group">
                    <GoogleIcon className="w-4 h-4 bg-white p-0.5 rounded-full" />
                    <span>{isLoggingIn ? 'Connexion...' : 'Se connecter pour explorer'}</span>
                    <ArrowRight className="w-4 h-4 text-accent-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>

              {/* Mockup UI */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="w-full max-w-md relative">
                  <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-subtle dark:shadow-none">
                    <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-danger" />
                        <div className="w-3 h-3 rounded-full bg-accent-400" />
                        <div className="w-3 h-3 rounded-full bg-brand-600" />
                        <span className="text-xs font-bold text-ink-muted ml-2">AscendUAC / Catalogue</span>
                      </div>
                      <span className="text-[10px] font-bold text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse inline-block" />
                        En ligne
                      </span>
                    </div>

                    {/* Search */}
                    <div className="bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-xs text-ink-muted flex items-center gap-2 mb-3.5">
                      <Search className="w-4 h-4 text-ink-muted" />
                      <span className="font-medium">Physique médicale, Imagerie...</span>
                    </div>

                    {/* Filter pills */}
                    <div className="flex items-center gap-1.5 mb-4 text-[11px] overflow-hidden">
                      <span className="px-2.5 py-1 bg-brand-700 text-white rounded-lg font-semibold">Tous</span>
                      {['1ère année', '2ème année', '3ème année'].map((y) => (
                        <span key={y} className="px-2.5 py-1 bg-surface-2 text-ink-muted rounded-lg font-medium">{y}</span>
                      ))}
                    </div>

                    {/* Epreuve cards */}
                    <div className="space-y-2.5 text-xs">
                      {[
                        { title: 'Physique Médicale & Rayonnements', type: 'Devoir', level: '1ère année', year: '2024-2025', corrige: true, typeColor: 'text-examType-devoir bg-examType-devoir/10 border-examType-devoir/30' },
                        { title: 'Électronique Médicale & Capteurs', type: 'Rattrapage', level: '2ème année', year: '2024-2025', corrige: false, typeColor: 'text-examType-rattrapage bg-examType-rattrapage/10 border-examType-rattrapage/30' },
                        { title: 'Maintenance Équipements Hospitaliers', type: 'Examen', level: '3ème année', year: '2023-2024', corrige: false, typeColor: 'text-examType-examen bg-examType-examen/10 border-examType-examen/30' },
                      ].map((item, i) => (
                        <div key={i} className="p-3 bg-surface-2 border border-surface-border rounded-xl hover:border-brand-500/50 transition-all">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-ink text-[11px] truncate mr-2">{item.title}</span>
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md shrink-0 ${item.typeColor}`}>{item.type}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-ink-muted">
                            <span>{item.level} • {item.year} • PDF</span>
                            {item.corrige && (
                              <span className="font-semibold text-brand-700 dark:text-accent-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Corrigé
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            5. POURQUOI ASCENDUAC — Cards
        ═══════════════════════════════════════════════════════ */}
        <section className="px-4 py-20 bg-surface border-y border-surface-border relative z-10">
          <div
            ref={whyReveal.ref}
            className={`max-w-5xl mx-auto relative z-10 reveal-up ${whyReveal.visible ? 'visible' : ''}`}
          >
            <div className="text-center mb-14">
              <h2 className="font-black text-3xl sm:text-4xl text-ink mb-4">
                Pourquoi utiliser <span className="text-brand-700 dark:text-accent-400">AscendUAC</span> ?
              </h2>
              <p className="text-ink-muted max-w-xl mx-auto text-base font-medium">
                Une réponse concrète aux difficultés réelles des étudiants en Maintenance Biomédicale et Hospitalière.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Search className="h-7 w-7" />,
                  title: 'Recherche instantanée',
                  desc: 'Filtre par matière, promotion et type d\'évaluation. Trouve précisément le sujet en quelques secondes.',
                },
                {
                  icon: <UploadCloud className="h-7 w-7" />,
                  title: 'Mémoire préservée',
                  desc: 'Tout est archivé dans le cloud avec des copies sécurisées, accessible à chaque nouvelle rentrée.',
                },
                {
                  icon: <Users className="h-7 w-7" />,
                  title: 'Entraide étudiante',
                  desc: 'Chaque étudiant peut contribuer en téléversant ses devoirs pour aider les promotions suivantes.',
                },
              ].map(({ icon, title, desc }, i) => (
                <div key={i} className="card-hover bg-surface-card border border-surface-border p-7 rounded-2xl shadow-subtle dark:shadow-none hover:border-brand-500/50 transition-all">
                  <div className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-accent-400 p-3.5 rounded-2xl w-fit mb-5 border border-brand-200 dark:border-brand-800">
                    {icon}
                  </div>
                  <h3 className="font-black text-xl mb-3 text-ink">{title}</h3>
                  <p className="text-ink-muted text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            6. COMMENT ÇA MARCHE
        ═══════════════════════════════════════════════════════ */}
        <section className="px-4 py-20 bg-surface-bg relative z-10">
          <div
            ref={howReveal.ref}
            className={`max-w-4xl mx-auto reveal-up ${howReveal.visible ? 'visible' : ''}`}
          >
            <h2 className="font-black text-3xl sm:text-4xl text-center mb-4 text-ink">Comment ça marche ?</h2>
            <p className="text-center text-ink-muted text-base mb-14 max-w-xl mx-auto">3 étapes. Moins d&apos;une minute. Sans fournir le moindre mot de passe.</p>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {[
                { n: '1', title: 'Connecte-toi avec Google', desc: 'Connexion instantanée en 1 clic sans mot de passe à retenir.', icon: <LogIn className="w-5 h-5" /> },
                { n: '2', title: 'Consulte ou télécharge', desc: 'Filtre par matière et promotion, puis télécharge les sujets et corrigés PDF.', icon: <Download className="w-5 h-5" /> },
                { n: '3', title: 'Partage tes épreuves', desc: 'Dépose tes devoirs récents pour faire grandir la promo entière.', icon: <UploadCloud className="w-5 h-5" /> },
              ].map(({ n, title, desc, icon }, i) => (
                <div key={i} className="card-hover flex flex-col items-center text-center bg-surface-card border border-surface-border p-8 rounded-2xl shadow-subtle dark:shadow-none hover:border-brand-500/50 transition-all">
                  <div className="relative mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-accent-400 flex items-center justify-center font-black text-2xl border-2 border-brand-200 dark:border-brand-800">
                      {n}
                    </div>
                    <div className="absolute -right-2 -bottom-2 w-7 h-7 rounded-xl bg-brand-700 text-white flex items-center justify-center shadow-xs">
                      {icon}
                    </div>
                  </div>
                  <h3 className="font-black text-lg mb-2 text-ink">{title}</h3>
                  <p className="text-ink-muted text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            7. MATIÈRES & FILIÈRE
        ═══════════════════════════════════════════════════════ */}
        <section className="px-4 py-20 bg-surface border-t border-surface-border text-center relative z-10">
          <div
            ref={matiereReveal.ref}
            className={`max-w-4xl mx-auto relative z-10 reveal-up ${matiereReveal.visible ? 'visible' : ''}`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-full text-xs font-bold text-brand-800 dark:text-brand-200 mb-5 border border-brand-200 dark:border-brand-800/40">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-700 dark:text-accent-400" />
              Cursus Spécialisé EPAC
            </div>
            <h2 className="font-black text-2xl sm:text-3xl mb-4 text-ink">
              Filière Maintenance Biomédicale &amp; Hospitalière (MBH)
            </h2>
            <p className="text-ink-muted text-sm sm:text-base max-w-xl mx-auto mb-10">
              Département de Génie Biomédical — École Polytechnique d&apos;Abomey-Calavi (EPAC, UAC).
            </p>

            <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto mb-12">
              {[
                'Thermodynamique', 'Électronique Médicale', 'Anglais technique',
                'Informatique', 'Anatomie & Physiologie', 'Sécurité & Normes Hospitalières',
                'Instrumentation Biomédicale', "Télémédecine & Systèmes d'Information",
              ].map((matiere, idx) => (
                <div key={idx} className="card-hover px-4 py-2 bg-surface-2 border border-surface-border rounded-xl text-xs sm:text-sm font-semibold text-ink hover:border-brand-500/50 hover:bg-surface flex items-center gap-2 cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-accent-400" />
                  {matiere}
                </div>
              ))}
            </div>

            {isAuthenticated ? (
              <Link href="/epreuves" className="inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-8 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-sm sm:text-base font-bold shadow-md shadow-brand/20 transition-all group">
                <span>Accéder aux épreuves maintenant</span>
                <ArrowRight className="h-4 w-4 text-accent-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <button type="button" onClick={() => handleGoogleLogin('/epreuves')} disabled={isLoggingIn}
                className="inline-flex items-center justify-center gap-3 h-12 sm:h-14 px-8 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-sm sm:text-base font-bold shadow-md shadow-brand/20 transition-all cursor-pointer group">
                <GoogleIcon className="w-4 h-4 bg-white p-0.5 rounded-full" />
                <span>{isLoggingIn ? 'Connexion...' : 'Se connecter avec Google pour réviser'}</span>
                <ArrowRight className="h-4 w-4 text-accent-400 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            8. FAQ
        ═══════════════════════════════════════════════════════ */}
        <section className="px-4 py-20 bg-surface-bg border-t border-surface-border relative z-10">
          <div
            ref={faqReveal.ref}
            className={`max-w-2xl mx-auto reveal-up ${faqReveal.visible ? 'visible' : ''}`}
          >
            <h2 className="font-black text-2xl sm:text-3xl text-ink text-center mb-10">Questions fréquentes</h2>
            <div className="bg-surface-card rounded-3xl border border-surface-border shadow-subtle dark:shadow-none divide-y divide-surface-border overflow-hidden">
              {[
                { q: "L'accès aux annales est-il vraiment gratuit ?", a: "Oui, l'accès et le téléchargement de toutes les épreuves sont 100% gratuits pour tous les étudiants de la filière MBH et de l'EPAC, sans aucun abonnement ni carte bancaire." },
                { q: "Pourquoi dois-je me connecter avec Google ?", a: "La connexion Google en 1 clic permet d'identifier les étudiants de l'EPAC, de sécuriser la plateforme, de mémoriser vos préférences et de tracer les dépôts d'épreuves sans exiger de mot de passe supplémentaire." },
                { q: "Comment déposer une épreuve ou un corrigé ?", a: "Connectez-vous avec votre compte Google, rendez-vous sur la page Déposer, sélectionnez votre matière et niveau, puis glissez votre document (PDF ou photo nette). Votre sujet est mis à disposition de toute la promo." },
                { q: "Qui gère et maintient AscendUAC ?", a: "La plateforme AscendUAC est conçue et développée par optossou@gmail.com pour l'ensemble des étudiants de l'EPAC et de l'Université d'Abomey-Calavi (UAC)." },
              ].map(({ q, a }, i) => (
                <div key={i} className="group">
                  <button type="button" onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-ink hover:text-brand-700 dark:hover:text-accent-400 transition-colors px-6 py-5 gap-3">
                    <span>{q}</span>
                    <ChevronDown className={`w-4 h-4 text-ink-muted transition-all duration-300 shrink-0 ${openFaqIndex === i ? 'rotate-180 text-brand-700 dark:text-accent-400' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="px-6 pb-5 text-sm text-ink-muted leading-relaxed">{a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            9. CTA FINAL
        ═══════════════════════════════════════════════════════ */}
        {!isAuthenticated && (
          <section className="px-4 py-20 relative z-10 bg-brand-800 text-white overflow-hidden">
            <div
              ref={ctaReveal.ref}
              className={`max-w-2xl mx-auto text-center relative z-10 reveal-scale ${ctaReveal.visible ? 'visible' : ''}`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-accent-400 mb-6 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Rejoins tes camarades sur AscendUAC
              </div>
              <h2 className="font-black text-3xl sm:text-4xl text-white mb-5 leading-tight">
                Prêt(e) à réviser avec les vraies épreuves MBH ?
              </h2>
              <p className="text-brand-100 text-base mb-10 leading-relaxed">
                Connecte-toi en 5 secondes avec ton compte Google et accède instantanément à toutes les archives.
              </p>
              <button
                type="button"
                onClick={() => handleGoogleLogin('/epreuves')}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-3 h-14 px-10 rounded-2xl bg-white text-brand-900 text-base font-black shadow-xl hover:-translate-y-1 active:scale-95 transition-all cursor-pointer group"
              >
                <GoogleIcon className="w-5 h-5" />
                <span>{isLoggingIn ? 'Connexion en cours...' : 'Se connecter gratuitement avec Google'}</span>
                <ArrowRight className="h-5 w-5 text-brand-700 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-brand-200 text-xs mt-5">Aucune carte bancaire · Gratuit à vie · Sécurisé par Google</p>
            </div>
          </section>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════
          10. FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer className="bg-surface-2 border-t border-surface-border text-ink-muted py-12 px-4 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <Logo />
            </Link>
            <p className="text-xs text-ink-muted max-w-xs leading-relaxed">
              Plateforme académique d&apos;annales et de suivi de notes pour les étudiants de l&apos;EPAC et de l&apos;Université d&apos;Abomey-Calavi (UAC) — Bénin.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
              <span className="font-semibold text-brand-700 dark:text-accent-400">Service opérationnel</span>
            </div>
            <p className="text-ink-muted text-center md:text-right">
              © {new Date().getFullYear()} AscendUAC · Développé pour la filière MBH
            </p>
            <p className="text-ink-muted/80">EPAC — Université d&apos;Abomey-Calavi</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-bg" />}>
      <LandingContent />
    </Suspense>
  );
}
