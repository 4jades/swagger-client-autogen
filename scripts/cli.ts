#!/usr/bin/env -S npx tsx

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const command = process.argv[2];
const args = process.argv.slice(3);

function showHelp() {
  console.log(`
🚀 swagger-client-autogen CLI

사용법:
  swagger-autogen <command> [options]

명령어:
  init                설정 파일 생성 (인터랙티브)
  fetch               Swagger 파일 다운로드 및 병합
  generate        API 클라이언트 코드 생성

예시:
  swagger-autogen init
  swagger-autogen fetch --config swagger/config.ts
  swagger-autogen generate --config swagger/config.ts

도움말:
  swagger-autogen --help, -h
  `);
}

function runScript(scriptPath: string, args: string[]) {
  const child = spawn('npx', ['tsx', scriptPath, ...args], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('close', (code) => {
    process.exit(code);
  });

  child.on('error', (error) => {
    console.error(`실행 오류: ${error.message}`);
    process.exit(1);
  });
}

switch (command) {
  case 'init':
    runScript(join(__dirname, 'init.ts'), args);
    break;
    
  case 'fetch':
    runScript(join(__dirname, 'fetch-swagger.js'), args);
    break;
    
  case 'generate':
    runScript(join(__dirname, 'generate-all.js'), args);
    break;
    
  case '--help':
  case '-h':
  case 'help':
    showHelp();
    break;
    
  default:
    if (!command) {
      console.error('❌ 명령어를 입력해주세요.');
    } else {
      console.error(`❌ 알 수 없는 명령어: ${command}`);
    }
    showHelp();
    process.exit(1);
}