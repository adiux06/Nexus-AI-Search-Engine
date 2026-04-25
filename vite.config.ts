import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'GEMINI_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  optimizeDeps: {
    include: ['fsevents'],
  },
  build: {
    rollupOptions: {
      external: [
        'fsevents',
        'fs',
        'path',
        'os',
        'events',
        'child_process',
        'util',
        'crypto',
        'stream',
        'url',
        'querystring',
        'zlib',
        'http',
        'https',
        'net',
        'tls',
        'dns',
        'worker_threads',
        'buffer',
        'assert',
        'constants',
        'timers',
        'async_hooks',
        'tty',
        'domain',
        'inspector',
        'readline',
        'repl',
        'perf_hooks',
        'v8',
        'vm',
        'module',
        'cluster',
        'process',
        'punycode',
        'string_decoder',
        'sys',
        'v8',
        'url',
        'wasi',
        'worker_threads'
      ],
    },
  },
  server: {
    // HMR can be disabled via DISABLE_HMR when file watching should stay quiet.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
