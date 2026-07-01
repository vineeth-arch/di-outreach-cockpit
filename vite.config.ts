import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ponytail: no proxy needed — `vercel dev` serves /api and the SPA on one origin.
export default defineConfig({
  plugins: [react()],
});
