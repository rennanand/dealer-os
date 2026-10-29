import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { host: true, port: 5173 },
  base: mode === 'app' ? './' : '/',
  build: { outDir: mode === 'app' ? 'dist-ios' : 'dist' },
}));
