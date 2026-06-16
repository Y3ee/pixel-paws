import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/PixelPaws/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lounge: resolve(__dirname, 'lounge.html')
      }
    }
  }
});
