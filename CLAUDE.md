# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. This project uses Node.js 22.

## Commands
- Setup: `yarn install` and `npm install -g firebase-tools`
- Init Firebase: `firebase init`
- Serve: `firebase emulators:start`
- Deploy: `firebase deploy`
- Functions: `firebase deploy --only functions`
- Hosting: `firebase deploy --only hosting`
- Lint: `yarn lint`
- Tests: `yarn test`
- Dev: `yarn dev`

## Code Style Guidelines
- **Formatting**: Use 2-space indentation, no trailing whitespace
- **Imports**: Group imports by external libraries, then internal modules
- **Types**: Use TypeScript for type safety in functions and React components
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Error Handling**: Use try/catch with async/await and provide meaningful error messages
- **Firebase**: Keep security rules principle of least privilege
- **Database**: Structure Firestore data for shallow queries and minimal reads
- **Authentication**: Use Firebase Auth for user management

## Project Structure
- **Monorepo**: Uses Turborepo for managing the monorepo
- **Apps**: Contains the main applications
  - `web`: Main React web application built with Vite
- **Packages**: Contains shared packages used across apps

## Notes
This repository uses Firebase for backend and hosting. Follow the Firebase documentation for best practices on security rules, data modeling, and deployment.