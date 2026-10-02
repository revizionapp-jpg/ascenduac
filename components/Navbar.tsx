'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';
import { loginWithGoogleOrDemo } from '@/lib/auth-client';
import { 
  BookOpen, 
  Upload, 
  FolderArchive, 
  LogOut, 
  GraduationCap,
  Sparkles,
  ChevronDown,
  ShieldAlert,
  BarChart3
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

import { Logo } from './Logo';

const ADMIN_EMAIL = 'optossou@gmail.com';

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname?.startsWith(path + '/'));
  const userIsAdmin = Boolean(
    session?.user?.isAdmin ||
    session?.user?.role === 'admin' ||
    session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    session?.user?.email?.toLowerCase() === 'optossou@gmail.com' ||
    session?.user?.email?.toLowerCase() === 'ulrrichmagbonde@gmail.com' ||
    session?.user?.email?.toLowerCase() === 'richomagbonde@gmail.com'
  );

  // Fermer le menu au clic extérieur ou touche Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Fermer le menu au changement de route
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Charger le nombre d'épreuves en attente pour l'admin
  useEffect(() => {
    if (!userIsAdmin) return;
    fetch('/api/admin/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.pendingCount !== undefined) setPendingCount(data.pendingCount); })
      .catch(() => {});
  }, [userIsAdmin]);

  return (
    <header className="sticky top-0 z-40 glass-nav transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Filière Branding */}
          <Link href="/epreuves" className="flex items-center gap-3 group shrink-0">
            <Logo withText={true} size="md" />
          </Link>

          {/* Centre : Liens de navigation desktop */}
          <nav className="hidden md:flex items-center gap-1.5 bg-surface-2 p-1.5 rounded-full border border-surface-border">
            <Link
              href="/epreuves"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                isActive('/epreuves') && !isActive('/epreuves/')
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-surface-2'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${isActive('/epreuves') && !isActive('/epreuves/') ? 'text-white' : 'text-ink-muted'}`} />
              <span>Épreuves</span>
            </Link>

            <Link
              href="/deposer"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                isActive('/deposer')
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-surface-2'
              }`}
            >
              <Upload className={`w-4 h-4 ${isActive('/deposer') ? 'text-white' : 'text-ink-muted'}`} />
              <span>Déposer</span>
            </Link>

            <Link
              href="/mes-depots"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                isActive('/mes-depots')
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-surface-2'
              }`}
            >
              <FolderArchive className={`w-4 h-4 ${isActive('/mes-depots') ? 'text-white' : 'text-ink-muted'}`} />
              <span>Mes dépôts</span>
            </Link>

            <Link
              href="/notes"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                isActive('/notes')
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-surface-2'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${isActive('/notes') ? 'text-white' : 'text-ink-muted'}`} />
              <span>Mes Notes</span>
            </Link>

            {/* Lien Admin — style badge jaune */}
            {userIsAdmin && (
              <Link
                href="/admin"
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                  isActive('/admin')
                    ? 'bg-accent-400 text-brand-900 shadow-sm font-bold'
                    : 'text-accent-700 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-400/15'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-danger text-white text-[10px] font-black rounded-full shadow-sm animate-pulse">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
            )}
          </nav>

          {/* Right side: Theme toggle + Profile menu or Connexion button */}
          <div className="flex items-center gap-2">
            {/* Bouton thème — toujours visible */}
            <ThemeToggle />
            {status === 'loading' ? (
              <div className="w-9 h-9 rounded-full animate-shimmer" />
            ) : session ? (
              /* ── Menu Profil unifié (toutes tailles d'écran) ── */
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full border border-surface-border bg-surface-card hover:border-brand-200 hover:shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent-400/30"
                  aria-label="Menu profil utilisateur"
                  aria-expanded={menuOpen}
                >
                  <div className="relative">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'Profil'}
                        className="w-8 h-8 rounded-full object-cover border border-surface-border shadow-xs"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-700 to-brand-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        {(session.user?.name?.[0] || 'E').toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-500 border-2 border-surface-card rounded-full"></span>
                  </div>

                  <span className="hidden sm:block text-xs font-semibold text-ink max-w-[120px] truncate">
                    {session.user?.name?.split(' ')[0] || 'Étudiant'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown unifié */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-72 glass-dropdown rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* En-tête utilisateur */}
                    <div className="px-3.5 py-3 border-b border-surface-border bg-surface-2/70 rounded-xl mb-1.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-ink truncate">
                          {session.user?.name || 'Étudiant MBH'}
                        </p>
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold text-brand-900 bg-brand-100 rounded-badge uppercase tracking-wider shrink-0">
                          Actif
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted truncate">
                        {session.user?.email}
                      </p>
                    </div>

                    {/* Liens de navigation principaux */}
                    <div className="space-y-0.5 py-1">
                      <Link
                        href="/epreuves"
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                          isActive('/epreuves') && !isActive('/epreuves/')
                            ? 'bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-400'
                            : 'text-ink hover:bg-surface-2 hover:text-brand-700 dark:hover:text-brand-400'
                        }`}
                      >
                        <BookOpen className={`w-4 h-4 ${isActive('/epreuves') ? 'text-brand-600' : 'text-ink-muted'}`} />
                        <span>Consulter les épreuves</span>
                      </Link>

                      <Link
                        href="/deposer"
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                          isActive('/deposer')
                            ? 'bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-400'
                            : 'text-ink hover:bg-surface-2 hover:text-brand-700 dark:hover:text-brand-400'
                        }`}
                      >
                        <Upload className={`w-4 h-4 ${isActive('/deposer') ? 'text-brand-600' : 'text-ink-muted'}`} />
                        <span>Déposer une épreuve</span>
                      </Link>

                      <Link
                        href="/mes-depots"
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                          isActive('/mes-depots')
                            ? 'bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-400'
                            : 'text-ink hover:bg-surface-2 hover:text-brand-700 dark:hover:text-brand-400'
                        }`}
                      >
                        <FolderArchive className={`w-4 h-4 ${isActive('/mes-depots') ? 'text-brand-600' : 'text-ink-muted'}`} />
                        <span>Mes dépôts</span>
                      </Link>

                      <Link
                        href="/notes"
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                          isActive('/notes')
                            ? 'bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-400'
                            : 'text-ink hover:bg-surface-2 hover:text-brand-700 dark:hover:text-brand-400'
                        }`}
                      >
                        <BarChart3 className={`w-4 h-4 ${isActive('/notes') ? 'text-brand-600' : 'text-ink-muted'}`} />
                        <span>Mes Notes</span>
                      </Link>

                      {/* Lien Admin — badge jaune, pas rouge */}
                      {userIsAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className={`relative flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                            isActive('/admin')
                              ? 'bg-accent-100 dark:bg-accent-400/15 text-accent-700 dark:text-accent-400'
                              : 'text-accent-700 dark:text-accent-400 hover:bg-accent-100/80 dark:hover:bg-accent-400/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldAlert className="w-4 h-4" />
                            <span>Administration</span>
                          </div>
                          {pendingCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-danger text-white text-[10px] font-black rounded-full shadow-sm animate-pulse">
                              {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                          )}
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-surface-border my-1.5" />

                    {/* Changer de niveau */}
                    <Link
                      href="/onboarding"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-brand-700 dark:hover:text-brand-400 rounded-xl transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-ink-muted" />
                      <span>Changer mon niveau (1ère à 3ème année)</span>
                    </Link>

                    {/* Thème clair / sombre */}
                    <ThemeToggle showLabel className="w-full flex justify-start px-3.5 py-2.5 rounded-xl hover:bg-surface-2 text-ink" />

                    <div className="border-t border-surface-border my-1.5" />

                    {/* Déconnexion */}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-danger hover:bg-danger-50 dark:hover:bg-danger/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Bouton connexion (non authentifié) */
              <button
                onClick={() => loginWithGoogleOrDemo('/epreuves')}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-900 bg-accent-100 hover:bg-accent-400/30 px-4 py-2 rounded-xl border border-accent-400/50 transition-all shadow-subtle hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-brand-700" />
                <span>Connexion avec Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
