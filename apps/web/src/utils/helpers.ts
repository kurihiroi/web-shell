import * as R from 'ramda';

/**
 * Collection of utility functions using Ramda
 *
 * These are core helper functions used throughout the application
 * that leverage Ramda's functional programming capabilities.
 */

// Object manipulation
export const pickUserData = R.pick(['id', 'name', 'email']);

// Safe object property access with default value
export const getPropWithDefault = R.curry(
  <T>(defaultValue: T, propName: string, obj: Record<string, unknown>): T =>
    R.propOr(defaultValue, propName, obj)
);

// Safely get nested properties with a default value
export const getPath = R.curry(
  <T>(defaultValue: T, path: string[], obj: Record<string, unknown>): T =>
    R.pathOr(defaultValue, path, obj)
);

// Deep merge of objects
export const deepMerge = R.mergeDeepRight;

// Conditional application of functions
export const when = R.when;
export const ifElse = R.ifElse;
export const cond = R.cond;
