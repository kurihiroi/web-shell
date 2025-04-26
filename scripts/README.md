# Scripts

Utility scripts for the web-shell project.

## Firebase Environment Setup

### `setup-firebase-env.sh`

This script helps you set up Firebase configuration for the project by fetching settings from your Firebase project and creating the `.env.local` file with the appropriate environment variables.

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

#### Example

```bash
./scripts/setup-firebase-env.sh my-firebase-project
```

After running the script, the environment variables will be properly set up for the web application to connect to Firebase and enable authentication.