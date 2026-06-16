import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/pixel-paws/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lounge: resolve(__dirname, 'lounge.html')
      }
    }
  }
});
