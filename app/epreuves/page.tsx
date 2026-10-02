'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { TypeSegmentedControl } from '@/components/TypeSegmentedControl';
import { FilterChips } from '@/components/FilterChips';
import { EpreuveCard } from '@/components/EpreuveCard';
import { EpreuvesListSkeleton } from '@/components/EpreuveSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { BottomNavCTA } from '@/components/BottomNavCTA';
import { Epreuve, Matiere } from '@/types';
import {
  User,
  Sparkles,
  AlertCircle,
  GraduationCap,
  RotateCcw,
  X,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

function EpreuvesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Rediriger vers l'accueil si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [status, router]);

  // États des filtres synchronisés avec l'URL
  const queryParam = searchParams.get('q') || '';
  const niveauParam = searchParams.get('niveau') || '';
  const matiereParam = searchParams.get('matiere') || '';
  const anneeParam = searchParams.get('annee') || '';
  const typeParam = searchParams.get('type') || 'all';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limitParam = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [selectedNiveau, setSelectedNiveau] = useState(niveauParam);
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>(
    matiereParam ? matiereParam.split(',').filter(Boolean) : []
  );
  const [selectedAnnee, setSelectedAnnee] = useState(anneeParam);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [limit, setLimit] = useState(limitParam);

  // Données
  const [epreuves, setEpreuves] = useState<Epreuve[]>([]);
  const [matieresList, setMatieresList] = useState<Matiere[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [userNiveau, setUserNiveau] = useState<string | null>(null);

  // États d'interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des matières pour les filtres
  useEffect(() => {
    fetch('/api/matieres')
      .then((res) => res.json())
      .then((data) => {
        if (data.matieres) setMatieresList(data.matieres);
      })
      .catch((err) => console.error('Erreur chargement matières:', err));
  }, []);

  // Synchroniser les paramètres dans l'URL (déclaré avant les useEffect qui en dépendent)
  const updateUrl = useCallback(
    (newParams: {
      q?: string;
      niveau?: string;
      matieres?: string[];
      annee?: string;
      type?: string;
      page?: number;
      limit?: number;
    }) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      if (newParams.q !== undefined) {
        if (newParams.q.trim()) current.set('q', newParams.q.trim());
        else current.delete('q');
      }

      if (newParams.niveau !== undefined) {
        if (newParams.niveau && newParams.niveau !== 'all' && newParams.niveau !== 'Tous les niveaux') {
          current.set('niveau', newParams.niveau);
        } else {
          current.delete('niveau');
        }
      }

      if (newParams.matieres !== undefined) {
        if (newParams.matieres.length > 0) {
          current.set('matiere', newParams.matieres.join(','));
        } else {
          current.delete('matiere');
        }
      }

      if (newParams.annee !== undefined) {
        if (newParams.annee && newParams.annee !== 'all') {
          current.set('annee', newParams.annee);
        } else {
          current.delete('annee');
        }
      }

      if (newParams.type !== undefined) {
        if (newParams.type && newParams.type !== 'all') {
          current.set('type', newParams.type);
        } else {
          current.delete('type');
        }
      }

      if (newParams.page !== undefined) {
        if (newParams.page > 1) current.set('page', String(newParams.page));
        else current.delete('page');
      } else if (
        newParams.q !== undefined ||
        newParams.niveau !== undefined ||
        newParams.matieres !== undefined ||
        newParams.annee !== undefined ||
        newParams.type !== undefined
      ) {
        current.delete('page');
        setCurrentPage(1);
      }

      if (newParams.limit !== undefined) {
        if (newParams.limit !== 10) current.set('limit', String(newParams.limit));
        else current.delete('limit');
      }

      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.replace(`/epreuves${query}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Charger le profil de l'utilisateur connecté : initialiser le niveau ou rediriger vers onboarding à la 1ère connexion
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/profil')
        .then((res) => res.json())
        .then((data) => {
          if (data.profil?.niveau) {
            setUserNiveau(data.profil.niveau);
            if (!niveauParam) {
              setSelectedNiveau(data.profil.niveau);
              updateUrl({ niveau: data.profil.niveau });
            }
          } else {
            // Première connexion : aucun niveau enregistré, redirection immédiate vers onboarding
            router.replace('/onboarding');
          }
        })
        .catch((err) => console.error('Erreur lecture profil:', err));
    }
  }, [session, niveauParam, router, updateUrl]);

  // Récupérer les épreuves filtrées depuis l'API avec pagination
  const fetchEpreuves = useCallback(async (targetPage = currentPage, targetLimit = limit) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', String(targetLimit));
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedNiveau && selectedNiveau !== 'all' && selectedNiveau !== 'Tous les niveaux') {
        params.set('niveau', selectedNiveau);
      }
      if (selectedMatieres.length > 0) {
        params.set('matiere', selectedMatieres.join(','));
      }
      if (selectedAnnee && selectedAnnee !== 'all') {
        params.set('annee', selectedAnnee);
      }
      if (selectedType && selectedType !== 'all') {
        params.set('type', selectedType);
      }

      const res = await fetch(`/api/epreuves?${params.toString()}`);
      if (!res.ok) throw new Error('Impossible de charger les épreuves.');
      const data = await res.json();
      setEpreuves(data.epreuves || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || targetPage);
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, searchQuery, selectedNiveau, selectedMatieres, selectedAnnee, selectedType]);

  useEffect(() => {
    fetchEpreuves();
  }, [fetchEpreuves]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    updateUrl({ page: newPage });
    fetchEpreuves(newPage, limit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    updateUrl({ page: 1, limit: newLimit });
    fetchEpreuves(1, newLimit);
  };

  // Gestion des filtres
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrl({ q: val });
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    updateUrl({ type });
  };

  const handleApplyChips = (filters: {
    niveau: string;
    matieres: string[];
    annee: string;
  }) => {
    setSelectedNiveau(filters.niveau);
    setSelectedMatieres(filters.matieres);
    setSelectedAnnee(filters.annee);
    updateUrl({
      niveau: filters.niveau,
      matieres: filters.matieres,
      annee: filters.annee,
    });
  };

  const handleResetAll = () => {
    const defaultNiveau = userNiveau || 'all';
    setSearchQuery('');
    setSelectedType('all');
    setSelectedNiveau(defaultNiveau);
    setSelectedMatieres([]);
    setSelectedAnnee('all');
    updateUrl({
      q: '',
      type: 'all',
      niveau: defaultNiveau,
      matieres: [],
      annee: 'all',
    });
  };

  const hasActiveFilters = Boolean(
    (selectedNiveau && selectedNiveau !== 'all' && selectedNiveau !== 'Tous les niveaux') ||
    selectedMatieres.length > 0 ||
    (selectedAnnee && selectedAnnee !== 'all') ||
    (selectedType && selectedType !== 'all') ||
    searchQuery.trim().length > 0
  );

  // État de chargement de session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-ink-muted">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  // Si non authentifié, ne rien afficher pendant que le middleware / useEffect redirige
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-16">
        {/* Top Header / Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-brand-900 via-brand-700 to-brand-800 p-6 sm:p-8 text-white shadow-xl shadow-brand-700/10 mb-8 overflow-hidden">
          {/* Ambient light effect inside header */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-brand-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-accent-400">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Archives MBH • École Polytechnique d&apos;Abomey-Calavi</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-heading">
                Annales & Sujets d&apos;Épreuves
              </h1>

              <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
                Retrouvez instantanément les devoirs, examens et rattrapages passés pour vos révisions universitaires.
              </p>
            </div>

            {/* Profile Level pill & Total count badge */}
            <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                <span className="block text-xl font-black text-accent-400">{totalCount}</span>
                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                  Document{totalCount > 1 ? 's' : ''}
                </span>
              </div>

              <Link
                href="/onboarding"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface text-brand-700 dark:text-accent-400 hover:bg-surface-2 font-bold text-xs shadow-md border border-surface-border transition-all hover:scale-105 active:scale-95"
              >
                <User className="w-3.5 h-3.5 text-brand-700 dark:text-accent-400" />
                <span>{selectedNiveau && selectedNiveau !== 'all' ? selectedNiveau : 'Définir mon niveau'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Banner cross-link vers Suivi Notes */}
        <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-brand-50/60 dark:bg-brand-700/10 border border-brand-200/60 dark:border-brand-700/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-700/20 flex-shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                Simulateur & Suivi de Notes MBH
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-400/15 text-accent-700 dark:text-accent-400 border border-accent-400/30">Nouveau</span>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Calculez vos moyennes par UE (CC & ET), simulez vos résultats et consultez les annales directement associées.
              </p>
            </div>
          </div>
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md shadow-brand-700/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>Accéder à mes notes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Control Dock (Recherche + Type + Filtres) */}
        <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 mb-8">
          {/* Barre de recherche principale */}
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
          />

          {/* Segmented Control de Type */}
          <TypeSegmentedControl
            selectedType={selectedType}
            onChange={handleTypeChange}
          />

          {/* Chips de filtres déroulants */}
          <FilterChips
            selectedNiveau={selectedNiveau}
            selectedMatieres={selectedMatieres}
            selectedAnnee={selectedAnnee}
            matieresList={matieresList}
            onApplyFilters={handleApplyChips}
            onResetAll={handleResetAll}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Bandeau de filtres actifs amovibles individuellement */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-surface-border flex flex-wrap items-center gap-2 text-xs">
              <span className="text-ink-muted font-medium">Filtres actifs :</span>

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 text-ink font-semibold border border-surface-border">
                  <span>Recherche : &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    onClick={() => handleSearchChange('')}
                    className="hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedType && selectedType !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/60 capitalize">
                  <span>{selectedType}</span>
                  <button
                    onClick={() => handleTypeChange('all')}
                    className="hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedNiveau && selectedNiveau !== 'all' && selectedNiveau !== 'Tous les niveaux' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-700/40">
                  <span>{selectedNiveau}</span>
                  <button
                    onClick={() => updateUrl({ niveau: 'all' })}
                    className="hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedMatieres.map((mat) => (
                <span
                  key={mat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-700/40"
                >
                  <span className="truncate max-w-[120px]">{mat}</span>
                  <button
                    onClick={() => {
                      const updated = selectedMatieres.filter((m) => m !== mat);
                      setSelectedMatieres(updated);
                      updateUrl({ matieres: updated });
                    }}
                    className="hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {selectedAnnee && selectedAnnee !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-100 dark:bg-accent-400/15 text-accent-700 dark:text-accent-400 font-semibold border border-accent-400/40 dark:border-accent-400/30">
                  <span>{selectedAnnee}</span>
                  <button
                    onClick={() => updateUrl({ annee: 'all' })}
                    className="hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetAll}
                className="text-danger hover:underline font-bold ml-auto"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* Message d'erreur réseau */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 dark:bg-danger/10 border border-danger/30 rounded-2xl flex items-center justify-between text-xs text-danger">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchEpreuves()}
              className="font-bold underline hover:text-danger/80 ml-3"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Grille responsive des cartes d'épreuves (1 col mobile, 2 col tablette/desktop) */}
        {loading ? (
          <EpreuvesListSkeleton count={10} />
        ) : epreuves.length === 0 ? (
          <EmptyState
            title="Aucune épreuve trouvée"
            description="Aucune archive ne correspond à vos filtres actuels. Réinitialisez les filtres ou partagez vos sujets d'examens !"
            onReset={hasActiveFilters ? handleResetAll : undefined}
            showDepositCTA={true}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {epreuves.map((epreuve) => (
                <EpreuveCard key={epreuve.id} epreuve={epreuve} />
              ))}
            </div>

            {/* Barre de pagination moderne et intuitive */}
            {totalCount > 0 && (
              <div className="mt-8 pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
                <div className="flex items-center gap-3">
                  <span>
                    Affichage de <strong className="text-ink font-bold">{Math.min((currentPage - 1) * limit + 1, totalCount)}</strong> à <strong className="text-ink font-bold">{Math.min(currentPage * limit, totalCount)}</strong> sur <strong className="text-ink font-bold">{totalCount}</strong> épreuves
                  </span>
                  <span className="hidden sm:inline text-surface-border">•</span>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span>Par page :</span>
                    {[10, 20, 30].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => handleLimitChange(l)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${limit === l
                            ? 'bg-brand-700 text-white'
                            : 'text-ink-muted hover:bg-surface-2'
                          }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-ink hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium shadow-subtle dark:shadow-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden xs:inline">Précédent</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        if (
                          totalPages > 7 &&
                          p !== 1 &&
                          p !== totalPages &&
                          Math.abs(p - currentPage) > 1
                        ) {
                          if (p === 2 || p === totalPages - 1) {
                            return <span key={p} className="px-1 text-ink-muted">…</span>;
                          }
                          return null;
                        }

                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handlePageChange(p)}
                            className={`min-w-[34px] h-8 px-2 rounded-xl text-xs font-bold transition-all ${currentPage === p
                                ? 'bg-brand-700 text-white shadow-xs'
                                : 'bg-surface border border-surface-border text-ink hover:bg-surface-2'
                              }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-ink hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium shadow-subtle dark:shadow-none"
                    >
                      <span className="hidden xs:inline">Suivant</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNavCTA />
    </div>
  );
}

export default function EpreuvesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-semibold text-ink-secondary">Chargement du catalogue...</div>}>
      <EpreuvesContent />
    </Suspense>
  );
}