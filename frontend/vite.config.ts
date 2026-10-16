/// <reference types="vitest/config" />
// Owner: manager. Ports come from the ROOT .env written by scripts/bootstrap.sh.
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { seoPlugin } from './plugins/seo.ts';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '');
  // Fallback only matters when .env is absent (e.g. CI build); dev should always run after bootstrap.
  const port = Number(env.FRONTEND_PORT) || 4173;
  return {
    envDir: repoRoot,
    plugins: [react(), seoPlugin()],
    server: { port, strictPort: true },
    preview: { port, strictPort: true },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}', 'plugins/**/*.test.ts'],
    },
  };
});
