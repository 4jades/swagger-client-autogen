import { defineConfig } from 'tsup';

export default defineConfig([
  // TypeScript 파일들 (CLI 스크립트 포함, shebang 추가)
  {
    entry: ['src/scripts/**/*.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    minify: false,
    outDir: 'dist/scripts',
    shims: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // JavaScript 파일들 (scripts 폴더, shebang 추가)
  {
    entry: ['src/scripts/**/*.js'],
    format: ['esm'],
    dts: false, // JS 파일은 .d.ts 생성하지 않음
    splitting: false,
    sourcemap: true,
    minify: false,
    outDir: 'dist/scripts',
    shims: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // 나머지 모든 TypeScript 파일들
  {
    entry: ['src/**/*.ts', '!src/scripts/**/*'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    minify: false,
    outDir: 'dist',
    shims: true,
  },
  // 나머지 모든 JavaScript 파일들
  {
    entry: ['src/**/*.{js,ejs}', '!src/scripts/**/*'],
    format: ['esm'],
    dts: false, // JS 파일은 .d.ts 생성하지 않음
    splitting: false,
    sourcemap: true,
    minify: false,
    outDir: 'dist',
    shims: true,
  },
]);