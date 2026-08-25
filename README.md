# Myjoy Arena 🐍🏟️

**Myjoy Arena** est une plateforme web moderne et collaborative d'apprentissage et de défis de programmation conçue pour les étudiants en Python. Elle combine un environnement d'exécution de code directement dans le navigateur, des fonctionnalités de gamification poussées, un forum communautaire et des notifications push en temps réel.

---

## 🌟 Fonctionnalités Principales

- 🧩 **Défis & Challenges Python** :
  - Exercices variés classés par difficulté (*Facile*, *Moyen*, *Difficile*) et par catégories (*Bases*, *Structures de données*, *Algorithmes*, *Mathématiques*, *Fichiers & Modules*, etc.).
  - Validation automatique avec jeux de tests unitaires (tests visibles et tests cachés).
- 💻 **Éditeur de Code Navigateur Interactif** :
  - Coloration syntaxique et numérotation des lignes avec **CodeMirror**.
  - Exécution Python sécurisée et instantanée côté client grâce à **Pyodide** (Python compilé en WebAssembly dans le navigateur).
- 🏆 **Gamification & Classements** :
  - Système de points d'expérience (XP) et niveaux d'apprentissage.
  - Badges de succès déblocables automatiquement (ex. *Premier Défi Validé*, *Série de 7 jours*, *Maître des Algorithmes*).
  - Tableau des scores (Leaderboard) global et hebdomadaire.
- 💬 **Forum & Entraide Communautaire** :
  - Espace de discussion par catégorie et sous chaque défi.
  - Votes sur les réponses, fils de discussion et recherche de solutions partagées.
- 👤 **Profils Utilisateurs Détaillés** :
  - Statistiques de progression, taux de réussite, historique des soumissions et badges gagnés.
  - Personnalisation du profil (avatar, bio, liens sociaux).
- 🔔 **Notifications Push Web (PWA & Desktop)** :
  - Support de l'API standard Web Push & VAPID.
  - Alertes instantanées pour les nouveaux défis, badges débloqués et réponses reçues sur le forum.
- 🛡️ **Interface d'Administration Complète** :
  - Back-office Django robuste pour la gestion des défis, utilisateurs, catégories et modération.

---

## 🛠️ Stack Technique

- **Backend** : [Django 4.2 LTS](https://www.djangoproject.com/) (Python 3.11)
- **Base de Données** : PostgreSQL (Production sur Render) / SQLite (Développement local)
- **Moteur d'Exécution Client** : [Pyodide](https://pyodide.org/) (Python WebAssembly)
- **Éditeur de Code** : [CodeMirror](https://codemirror.net/)
- **Fichiers Statiques** : [WhiteNoise](http://whitenoise.evans.io/) avec compression Brotli/Gzip
- **Serveur WSGI** : [Gunicorn](https://gunicorn.org/)
- **Notifications Push** : `pywebpush` & `py-vapid` (Web Push API standard W3C)

---

## 📋 Prérequis

- **Python 3.11+**
- **pip** (gestionnaire de paquets Python)
- **Git**

---

## 🚀 Installation Locale

### 1. Cloner le dépôt et se positionner dans le répertoire

```bash
git clone https://github.com/votre-utilisateur/myjoy_arena.git
cd myjoy_arena
```

### 2. Créer et activer un environnement virtuel

- **Sur Linux / macOS :**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

- **Sur Windows (PowerShell / CMD) :**
  ```powershell
  python -m venv venv
  venv\Scripts\activate
  ```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configurer les variables d'environnement

Copiez le fichier `.env.example` en `.env` :

```bash
cp .env.example .env
```

*(Sur Windows CMD : `copy .env.example .env`)*

### 5. Appliquer les migrations de base de données

```bash
python manage.py migrate
```

### 6. Initialiser le superutilisateur et les données par défaut

```bash
python manage.py create_superuser
python manage.py seed_categories
```

> **Identifiants administrateur créés par défaut :**
> - **Nom d'utilisateur** : `Myjoy`
> - **Mot de passe** : `Myjoy*9876`

### 7. Lancer le serveur de développement

```bash
python manage.py runserver
```

Rendez-vous sur [http://127.0.0.1:8000/](http://127.0.0.1:8000/) dans votre navigateur !

---

## 🌐 Déploiement sur Render.com

Le projet inclut une configuration Render prête à l'emploi via le fichier `render.yaml` (Blueprint).

### Étapes de déploiement :

1. **Pousser votre code sur GitHub** :
   ```bash
   git add .
   git commit -m "Initial commit - Myjoy Arena"
   git push origin main
   ```

2. **Créer un nouveau Blueprint sur Render** :
   - Connectez-vous à votre compte [Render.com](https://render.com/).
   - Cliquez sur **New +** > **Blueprint**.
   - Sélectionnez votre dépôt GitHub `myjoy_arena`.

3. **Validation automatique** :
   - Render détecte automatiquement `render.yaml`.
   - Il provisionne :
     - Une base de données managée PostgreSQL (`myjoy-arena-db`).
     - Un service web Python (`myjoy-arena`).
   - Le script `build.sh` s'exécute automatiquement pour :
     - Installer les paquets `requirements.txt`.
     - Collecter les fichiers statiques (`collectstatic`).
     - Appliquer les migrations (`migrate`).
     - Créer le superutilisateur par défaut (`create_superuser`).
     - Peupler les catégories et défis initiaux (`seed_categories`).

4. **Configuration des Notifications Push (VAPID)** *(Optionnel mais recommandé)* :
   - Dans le tableau de bord Render, accédez aux **Environment Variables** de votre service web.
   - Vous pouvez générer une paire de clés VAPID en local :
     ```bash
     vapid --gen
     ```
   - Renseignez les variables :
     - `VAPID_PUBLIC_KEY`
     - `VAPID_PRIVATE_KEY`
     - `VAPID_ADMIN_EMAIL`

---

## 🔑 Accès Espace Administration

Accédez à l'interface d'administration Django à l'adresse `/admin` :
- **URL** : `http://127.0.0.1:8000/admin` (ou `https://<votre-app>.onrender.com/admin`)
- **Identifiant** : `Myjoy`
- **Mot de passe** : `Myjoy*9876`

> ⚠️ *Pensez à modifier le mot de passe administrateur lors d'une mise en production réelle.*

---

## 📁 Structure du Projet

```text
myjoy_arena/
├── manage.py               # Script de gestion Django
├── requirements.txt        # Dépendances Python du projet
├── runtime.txt             # Version Python pour l'hébergement
├── render.yaml             # Spécification d'infrastructure Render Blueprint
├── build.sh                # Script de construction & migration CI/CD
├── Procfile                # Définition du processus d'exécution Gunicorn
├── .env.example            # Exemple des variables d'environnement requises
├── .gitignore              # Fichiers et dossiers exclus du versionnement Git
├── README.md               # Documentation du projet
├── myjoy_arena/            # Configuration globale du projet Django
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/                   # Applications modulaires du projet
│   ├── accounts/           # Authentification, profils et gestion des utilisateurs
│   ├── challenges/         # Défis de code, tests et soumissions
│   ├── discussions/        # Forum communautaire et commentaires
│   ├── leaderboard/        # Classements, XP et badges
│   └── notifications/      # Système de notifications push Web & VAPID
├── static/                 # Fichiers statiques globaux (CSS, JS, images, logos)
└── templates/              # Gabarits HTML partagés
```

---

## 📄 Licence

Ce projet est distribué sous licence **MIT**. Consultez le fichier `LICENSE` pour plus de détails.
