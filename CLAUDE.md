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
- **Imports**: Organize imports with external libraries first, then internal modules (Biome handles this automatically)
- **Types**: Use TypeScript for type safety. Always define proper types for props, state, and function parameters/returns
- **TypeScript**: Prefer interfaces for object shapes, use type for unions/intersections, avoid any, enable strict mode
- **Naming**: camelCase for variables/functions, PascalCase for components/classes/interfaces, type names
- **Error Handling**: Use try/catch with async/await and provide meaningful error messages
- **React**: No need for React import (using React 19), functional components preferred with proper type annotations
- **Firebase**: Keep security rules principle of least privilege
- **Database**: Structure Firestore data for shallow queries and minimal reads

## Project Structure
- **Monorepo**: Uses Turborepo for managing the monorepo
- **Apps**: Contains the main applications
  - `web`: Main React web application built with Vite
- **Packages**: Contains shared packages used across apps

## Important Rules
- **Never Skip Pre-commit Hooks**: Never use `--no-verify` or other methods to bypass pre-commit hooks or linting. Always fix errors properly.
- **Always Fix Root Cause**: When encountering build or lint errors, fix the root cause rather than bypassing checks.
- **Quality Control**: All code must pass linting, type checking, and tests before being committed.

## Notes
This repository uses Firebase for backend and hosting with Biome for linting and formatting. All React components are written in TypeScript for better type safety and developer experience. The project uses Zod for schema validation, Ramda for functional programming utilities, and Firebase Authentication with Google provider for user authentication.