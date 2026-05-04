import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { EnvSchema } from './types';

export function loadSchema(schemaPath: string): EnvSchema {
  const absolutePath = resolve(process.cwd(), schemaPath);

  let raw: string;
  try {
    raw = readFileSync(absolutePath, 'utf-8');
  } catch {
    throw new Error(`Schema file not found: ${absolutePath}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in schema file: ${absolutePath}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Schema must be a JSON object mapping variable names to their definitions');
  }

  const schema = parsed as Record<string, unknown>;
  const validTypes = new Set(['string', 'number', 'boolean', 'url', 'email']);

  for (const [key, value] of Object.entries(schema)) {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`Schema entry for '${key}' must be an object`);
    }
    const entry = value as Record<string, unknown>;
    if (!entry.type || !validTypes.has(entry.type as string)) {
      throw new Error(`Schema entry for '${key}' has invalid or missing 'type'. Must be one of: ${[...validTypes].join(', ')}`);
    }
  }

  return parsed as EnvSchema;
}

export function loadEnvFile(envPath: string): Record<string, string> {
  const absolutePath = resolve(process.cwd(), envPath);

  let raw: string;
  try {
    raw = readFileSync(absolutePath, 'utf-8');
  } catch {
    throw new Error(`Env file not found: ${absolutePath}`);
  }

  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key) result[key] = value;
  }

  return result;
}
