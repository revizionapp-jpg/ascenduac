# AscendUAC — L'Outil de l'Étudiant (Annales & Suivi des Notes)

Bienvenue sur **AscendUAC**, la plateforme académique unifiée conçue pour les étudiants de l'**École Polytechnique d'Abomey-Calavi (EPAC)** et de l'**Université d'Abomey-Calavi (UAC)**, avec une spécialisation pour la filière **Maintenance Biomédicale et Hospitalière (MBH)**.

AscendUAC fusionne en une seule application web d'excellence :
1. **Banque d'Annales & Épreuves** : Consultation, recherche et téléchargement d'annales d'examens (1ère, 2ème, 3ème année), visionneuse PDF haute performance avec zoom et onglet corrigé, et module de dépôt collaboratif.
2. **Suivi des Notes & Simulateur** : Suivi des Unités d'Enseignement (UEs) Semestre 1 et 2, simulation et saisie des notes de Contrôle Continu (CC 50%) et Examen Terminal (ET 50%), calcul automatique des moyennes pondérées et alertes d'admissibilité (seuil 12/20).
3. **Synergie Étudiante** : Lien direct entre les fiches d'UEs et les sujets d'annales correspondants.

**Développeur & Administrateur Référent :** `optossou@gmail.com`

---

## Guide d'Installation & Démarrage Rapide

### 1. Prérequis
- **Node.js** (v18 ou supérieur, recommandé v20+)
- **NPM**

### 2. Démarrer le serveur local
Dans le terminal (PowerShell ou Bash) à la racine de `C:\Project` :
```powershell
# Si les scripts PowerShell sont restreints sur votre Windows :
npm.cmd run dev
# Ou classiquement :
npm run dev
```
L'application démarre sur : **`http://localhost:3005`**

---

## Configuration Complète : Google Sign-In & Base de Données

Toutes les configurations se font dans le fichier **`.env.local`**.

### Étape 1 : Activer la Connexion Google (Google OAuth 2.0)
Pour que la connexion Google fonctionne réellement :

1. Rendez-vous sur la **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Créez un projet (ex: *Outil Etudiant MBH*).
3. Allez dans **APIs et services** > **Écran de consentement OAuth** :
   - Choisissez **Externe** puis cliquez sur *Créer*.
   - Nom de l'application : `L'Outil de l'Étudiant MBH`.
   - Adresse e-mail d'assistance utilisateur : `optossou@gmail.com`.
   - Coordonnées du développeur : `optossou@gmail.com`.
   - Cliquez sur *Enregistrer et continuer*.
   - **Champs d'application (Scopes)** : ajoutez `.../auth/userinfo.email` et `.../auth/userinfo.profile`.
   - **Utilisateurs tests** : ajoutez votre propre adresse Gmail (`optossou@gmail.com`) et celles des étudiants testeurs.
4. Allez dans **APIs et services** > **Identifiants** :
   - Cliquez sur **+ CRÉER DES IDENTIFIANTS** > **ID client OAuth**.
   - Type d'application : **Application Web**.
   - Nom : `Client Web Etudiant`.
   - **Origines JavaScript autorisées** :
     - `http://localhost:3005`
     - `http://localhost:3000`
   - **URI de redirection autorisés** *(Très important)* :
     - `http://localhost:3005/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`
5. Copiez l'**ID client** et le **Secret client**, puis collez-les dans `.env.local` :
   ```env
   GOOGLE_CLIENT_ID="votre-id-client.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="votre-secret-client"
   ```

> 💡 **Mode Démo sans configuration :** Si vous ne configurez pas les clés Google immédiatement, l'application propose automatiquement un bouton de connexion rapide en mode démo avec `optossou@gmail.com` afin de ne jamais vous bloquer pendant le développement.

---

### Étape 2 : Base de Données PostgreSQL (Neon Serverless)
Pour enregistrer les épreuves, matières, UEs, notes et profils utilisateurs :

1. Créez un compte gratuit sur **[neon.tech](https://neon.tech)** (gratuit et sans carte bancaire).
2. Créez un projet nommé par exemple `annale229-epac`.
3. Sur votre tableau de bord Neon, copiez la chaîne de connexion PostgreSQL (**Connection string**).
4. Collez-la dans votre fichier `.env.local` :
   ```env
   NEON_DATABASE_URL="postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require"
   ```
5. Initialisez automatiquement toutes les tables et données de base (Matières MBH, UEs Semestre 1 et 2, ECUs) en exécutant :
   ```powershell
   npm.cmd run db:init
   ```
   Ce script exécute `lib/db/schema.sql` et vérifie la création de toutes les tables :
   - `utilisateurs`
   - `matieres` (8 matières officielles MBH)
   - `epreuves` (sujets et corrigés)
   - `ues` (MBH1101 à MBH1204)
   - `ecus` (16 éléments constitutifs)
   - `evaluations` (notes CC / ET)
   - `matiere_ue_map` (liaisons automatiques)
   - `connexions_log`

---

### Étape 3 : Stockage Cloudinary (Optionnel pour les PDF et images)
1. Créez un compte gratuit sur **[cloudinary.com](https://cloudinary.com)**.
2. Copiez vos 3 identifiants dans `.env.local` :
   ```env
   CLOUDINARY_CLOUD_NAME="votre_cloud_name"
   CLOUDINARY_API_KEY="votre_api_key"
   CLOUDINARY_API_SECRET="votre_api_secret"
   ```

---

## Structure des Dossiers

```
C:\Project\
├── app\
│   ├── layout.tsx              # Shell global, thème, session NextAuth
│   ├── page.tsx                # Page d'accueil portail : L'Outil de l'Étudiant
│   ├── epreuves\               # Catalogue des épreuves, filtres & recherche
│   │   └── [id]\page.tsx       # Visionneuse PDF, Zoom, onglet corrigé & partage
│   ├── notes\                  # Suivi des notes, simulation temps réel & moyennes
│   │   └── ue\[code]\page.tsx  # Détail par UE et simulateur de notes par ECU
│   ├── deposer\page.tsx        # Téléversement d'épreuve multi-pages avec PDF fusionné
│   ├── mes-depots\page.tsx     # Tableau de bord des contributions de l'étudiant
│   ├── admin\page.tsx          # Modération, validation, export ZIP & statistiques
│   └── api\                    # Points d'API backend (auth, epreuves, notes, stats)
├── components\                 # Composants UI (Navbar, ThemeToggle, etc.)
├── lib\
│   ├── auth.ts                 # Configuration NextAuth (Google OAuth + Démo)
│   ├── db\
│   │   ├── schema.sql          # Schéma complet PostgreSQL
│   │   ├── neon.ts             # Client PostgreSQL Neon Serverless
│   │   └── schema-init.ts      # Initialisation automatique au runtime
│   └── storage\                # Gestionnaires de données et Cloudinary
└── scripts\
    └── setup-db.js             # Commande 'npm run db:init'
```

---

## Comptes et Rôles

- **Administrateur Principal & Développeur :** `optossou@gmail.com`
- Possède l'accès complet au panneau `/admin`, à la validation des épreuves déposées, au téléversement groupé et aux journaux d'audit.
