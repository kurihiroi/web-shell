# Scripts

Utility scripts for the web-shell project.

## Firebase Environment Setup

There are two scripts available for setting up Firebase configuration:

### 1. `setup-firebase-env.sh` (Manual)

This script helps you set up Firebase configuration by guiding you through manual steps to fetch settings from Firebase Console and create the `.env.local` file with the appropriate environment variables.

#### Usage

```bash
./scripts/setup-firebase-env.sh <project-id>
```

#### What it does

1. Checks if Firebase CLI is installed
2. Verifies your Firebase login status
3. Lists available Firebase projects if no project ID is provided
4. Guides you through getting the required Firebase Web SDK configuration from Firebase Console
5. Creates a properly formatted `.env.local` file in the apps/web directory
6. Provides instructions for enabling Google authentication in Firebase Console

#### Requirements

- Firebase CLI tools installed (`npm install -g firebase-tools`)
- Firebase account with access to the project
- Browser access to Firebase Console

### 2. `auto-setup-firebase.js` (Automated)

This script automatically fetches Firebase configuration using the Firebase Admin SDK and creates the `.env.local` file with minimal manual intervention.

#### Usage

```bash
node scripts/auto-setup-firebase.js <project-id>
```

#### What it does

1. Checks prerequisites (firebase-admin package, project ID)
2. Automatically retrieves Firebase configuration using Admin SDK
3. Creates or uses an existing Web App in your Firebase project
4. Generates the `.env.local` file with all required environment variables
5. Provides guidance for setting up Google authentication

#### Requirements

- Node.js 14+
- Firebase CLI tools installed and logged in
- Service account with appropriate permissions for your Firebase project
- Admin SDK service account credentials (the script will guide you to create these if needed)

#### Example

```bash
node scripts/auto-setup-firebase.js my-firebase-project
```

After running either script, the environment variables will be properly set up for the web application to connect to Firebase and enable authentication.