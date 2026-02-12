import 'server-only';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  N8N_ANALYZE_WEBHOOK_URL: requireEnv('N8N_ANALYZE_WEBHOOK_URL'),
};
