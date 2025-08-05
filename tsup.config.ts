import { defineConfig } from 'tsup'

export default defineConfig([
  // 메인 라이브러리 빌드
  {
    entry: ['index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    minify: false,
    outDir: 'dist',
    shims: true,
  },
  // CLI 스크립트 빌드 (shebang 포함)
  {
    entry: ['scripts/cli.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    minify: false,
    outDir: 'dist',
    shims: true,
    banner: {
      js: '#!/usr/bin/env node'
    },
    outExtension() {
      return {
        js: ".js"
      }
    }
  },
  // 다른 스크립트 파일들 빌드
  {
    entry: ['scripts/init.ts'],
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    minify: false,
    outDir: 'dist/scripts',
    shims: true,
  }
])