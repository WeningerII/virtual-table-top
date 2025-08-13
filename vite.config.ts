import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      state:    path.resolve(__dirname, './state'),
      services: path.resolve(__dirname, './services'),
      engine:   path.resolve(__dirname, './engine'),
      hooks:    path.resolve(__dirname, '.'),        // your hooks live at repo root
      shared:   path.resolve(__dirname, './shared'),
      utils:    path.resolve(__dirname, './utils'),
      types:    path.resolve(__dirname, './types'),
    },
  },
});
