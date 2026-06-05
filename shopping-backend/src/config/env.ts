import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let envLoaded = false;

export function loadEnvFile() {
  if (envLoaded) return;
  envLoaded = true;

  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value.replace(/^["']|["']$/g, '');
    }
  });
}

export function getEnv(name: string, fallback = '') {
  loadEnvFile();
  return process.env[name] || fallback;
}

export function getRequiredEnv(name: string) {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Add it to shopping-backend/.env.`);
  }
  return value;
}

export function getBooleanEnv(name: string, fallback = false) {
  const value = getEnv(name);
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}
