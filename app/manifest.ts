import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AscendUAC — Outil de l\'Étudiant EPAC & UAC',
    short_name: 'AscendUAC',
    description: 'Plateforme officielle de dépôt d\'épreuves et de suivi des notes des étudiants de l\'UAC (Génie Biomédical & Hospitalier, MBH • EPAC).',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF5',
    theme_color: '#1F7A3A',
    icons: [
      {
        src: '/icons/Icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/Icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/Icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/Icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
