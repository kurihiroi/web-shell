# web-shell

A React-based web application built with Firebase for authentication and hosting.

## Project Overview

This is a monorepo project built with Turborepo that contains a React web application using Firebase for authentication services. The project uses modern tooling including:

- **pnpm** as the package manager
- **Turborepo** for monorepo management
- **Vite** for frontend build tooling
- **React 19** for the UI library
- **TypeScript** for type safety
- **Biome** for linting and formatting
- **Firebase** for backend and authentication
- **Husky** for Git hooks

## Project Structure

```
web-shell/
├── apps/
│   └── web/ - Main React web application
│       ├── src/
│       │   ├── components/ - React components
│       │   ├── context/ - React context providers
│       │   ├── firebase/ - Firebase configuration
│       │   └── utils/ - Utility functions
│       ├── public/ - Static assets
│       └── package.json - App-specific dependencies
├── packages/ - Shared libraries (empty)
├── scripts/ - Utility scripts
│   └── setup-firebase-env.sh - Firebase setup script
├── public/ - Static files for deployment
├── CLAUDE.md - Claude Code guidelines
├── biome.json - Biome configuration
├── firebase.json - Firebase configuration
├── package.json - Root dependencies and scripts
└── turbo.json - Turborepo configuration
```

## Features

- **Firebase Authentication**: Google sign-in implementation with both popup and redirect methods
- **React Context**: Auth state management using React Context API
- **TypeScript**: Full type safety throughout the application
- **Environment Variables**: Proper handling of Firebase configuration via environment variables

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Ramda for functional utilities
- Zod for schema validation

### Backend & Infrastructure
- Firebase Authentication
- Firebase Hosting

### Development Tools
- Turborepo for monorepo management
- pnpm for package management
- Biome for linting and formatting
- Husky for Git hooks
- lint-staged for pre-commit checks

## Development Setup

### Prerequisites
- Node.js 22+
- pnpm 10.9.0+
- Firebase CLI (`npm install -g firebase-tools`)

### Installation
```bash
# Install dependencies
pnpm install

# Set up Firebase environment
./scripts/setup-firebase-env.sh <project-id>
```

### Development Commands
- **Development**: `pnpm dev` or `firebase emulators:start`
- **Build**: `pnpm build` or `turbo run build`
- **Lint**: `pnpm lint` or `pnpm lint:biome`
- **Format**: `pnpm format`
- **Type Check**: `pnpm check:ts`
- **Clean**: `pnpm clean`
- **Deploy**: `firebase deploy` or `firebase deploy --only hosting`

## Configuration

### Firebase Setup
1. Create a Firebase project in the Firebase Console
2. Register a web app in your Firebase project
3. Run `./scripts/setup-firebase-env.sh <project-id>` to configure environment variables
4. Enable Google authentication provider in Firebase Console

### Environment Variables
Required variables for Firebase configuration:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Code Style
- 2-space indentation
- Single quotes for strings
- 100 character line width
- ES5 trailing commas
- Semicolons required

## Git Workflow
- Husky enforces code quality at commit time:
  - Blocks commits if unstaged changes exist
  - Runs lint-staged to check and format staged files
  - Executes linting and build to ensure code quality
  - Prevents pushing broken code