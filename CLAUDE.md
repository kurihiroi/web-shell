# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. This project uses Node.js 22 with pnpm as the package manager.

## Commands
- Setup: `pnpm install` and `npm install -g firebase-tools` 
- Firebase Setup: `./scripts/setup-firebase-env.sh <project-id>` (sets up Firebase environment variables)
- Dev: `pnpm dev` or `firebase emulators:start`
- Build: `pnpm build` or `turbo run build`
- Lint: `pnpm lint` or `pnpm lint:biome`
- Format: `pnpm format`
- Check: `pnpm check` (Biome check) or `pnpm check:ts` (TypeScript check)
- Test: `pnpm test` (for a single test, use `cd apps/<app> && vitest run <test-file>`)
- Deploy: `firebase deploy` or `firebase deploy --only hosting`
- Clean: `pnpm clean` or `turbo run clean`

## Code Style Guidelines
- **Formatting**: 2-space indentation, single quotes, 100 char line width, trailing commas (ES5), semicolons required
- **Imports**: 
  - Use ES modules syntax (`import`/`export`) exclusively - no CommonJS (`require`/`module.exports`)
  - Organize imports with external libraries first, then internal modules (Biome handles this automatically)
  - Use named exports over default exports for better refactoring support
  - Use type imports (`import type { X } from 'y'`) for type-only imports
- **Types**: Use TypeScript for type safety. Always define proper types for props, state, and function parameters/returns
- **TypeScript**: Prefer interfaces for object shapes, use type for unions/intersections, avoid any, enable strict mode
- **Naming**: camelCase for variables/functions, PascalCase for components/classes/interfaces, type names
- **Error Handling**: Use try/catch with async/await and provide meaningful error messages
- **React**: No need for React import (using React 19), functional components preferred with proper type annotations
- **State Management**: Use custom hooks instead of Context API for state management. Create reusable hooks in the `hooks` directory
- **Firebase**: Keep security rules principle of least privilege
- **Database**: Structure Firestore data for shallow queries and minimal reads

## Project Structure
- **Monorepo**: Uses Turborepo for managing the monorepo
- **Apps**: Contains the main applications
  - `web`: Main React web application built with Vite
    - `src/components`: React components organized by feature
    - `src/hooks`: Custom hooks for state management and shared logic
    - `src/firebase`: Firebase configuration and auth utilities
    - `src/models`: Type definitions and schemas
    - `src/repositories`: Data access layer for Firestore
- **Packages**: Contains shared packages used across apps

## Important Rules
- **Never Skip Pre-commit Hooks**: Never use `--no-verify` or other methods to bypass pre-commit hooks or linting. Always fix errors properly.
- **Always Fix Root Cause**: When encountering build or lint errors, fix the root cause rather than bypassing checks.
- **Quality Control**: All code must pass linting, type checking, and tests before being committed.
- **No Direct Main Commits**: Never commit or push directly to the main branch. Always create a feature/fix branch and submit a pull request.
- **Pre-Commit Verification**: Before committing any changes, always run `pnpm lint`, `pnpm build`, `pnpm check`, and `pnpm test` to verify that your changes don't break the application. This ensures all TypeScript checks, linting rules, and tests pass before code review.

## Notes
This repository uses Firebase for backend and hosting with Biome for linting and formatting. All React components are written in TypeScript for better type safety and developer experience. The project uses Zod for schema validation, Ramda for functional programming utilities, and Firebase Authentication with Google provider for user authentication.