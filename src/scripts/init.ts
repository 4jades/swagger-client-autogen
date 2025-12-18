import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { writeFileToPath } from '../utils/file';

type InitConfig = Pick<
  import('../types/codegen-config').InputCodegenConfig,
  'uri' | 'createSchema' | 'username' | 'password'
>;

// 패키지 매니저 감지
function detectPackageManager(): string {
  if (existsSync('yarn.lock')) return 'yarn';
  if (existsSync('package-lock.json')) return 'npm';
  if (existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (existsSync('bun.lockb')) return 'bun';
  return 'npm'; // 기본값
}

// Config 파일 템플릿 생성
function generateConfigTemplate(config: InitConfig): string {
  return `import type { InputCodegenConfig } from 'swagger-client-autogen';

export const config: Partial<InputCodegenConfig> = {
  // Swagger 설정
  uri: '${config.uri}',
  ${
    config.username
      ? `
  // 인증 정보
  username: '${config.username}',
  password: '${config.password || ''}',
  `
      : ''
  }
  
  // 스키마 생성 여부
  createSchema: ${config.createSchema},

  // 출력 설정 (필요에 따라 주석 해제하여 사용)
  /*
  customOutput: {
    aliasInfo: {
      aliasMap: { '@': 'src' },
      aliasMapDepth: 2,
    },
    pathInfo: {
      dto: 'src/shared/api/dto.ts',
      api: 'src/entities/{moduleName}/api/index.ts',
      apiInstance: 'src/entities/{moduleName}/api/instance.ts',
      queries: 'src/entities/{moduleName}/api/queries.ts',
      mutations: 'src/entities/{moduleName}/api/mutations.ts',
      schema: 'src/shared/api/schema.gen.ts',
      apiUtils: 'src/shared/api/utils.gen.ts',
      streamUtils: 'src/shared/api/stream.gen.ts',
      typeGuards: 'src/shared/api/type-guards.gen.ts',
      streamHandlers: 'src/entities/{moduleName}/api/stream-handlers',
    },
  },
  */
};
`;
}

async function main() {
  console.clear();

  p.intro(pc.cyan('🚀 swagger-client-autogen 초기화'));

  // 예시 표시
  p.note(
    `${pc.yellow('로컬 파일:')} ./swagger.yml, api/swagger.json
${pc.yellow('원격 URL:')} https://api.example.com/swagger.json
${pc.yellow('개발 서버:')} http://localhost:3000/api-docs`,
    '💡 지원하는 입력 형식',
  );

  const uri = await p.text({
    message: 'Swagger JSON/YAML 경로를 입력하세요',
    placeholder: 'https://api.example.com/swagger.json',
    validate(value) {
      if (!value.trim()) return 'Swagger 경로는 필수입니다!';
      return undefined;
    },
  });

  if (p.isCancel(uri)) {
    p.cancel('초기화가 취소되었습니다.');
    process.exit(0);
  }

  const needsAuth = await p.confirm({
    message: '인증이 필요한 API인가요?',
    initialValue: false,
  });

  if (p.isCancel(needsAuth)) {
    p.cancel('초기화가 취소되었습니다.');
    process.exit(0);
  }

  let username = '';
  let password = '';

  if (needsAuth) {
    const authUsername = await p.text({
      message: '사용자명을 입력하세요',
      placeholder: 'username',
    });

    if (p.isCancel(authUsername)) {
      p.cancel('초기화가 취소되었습니다.');
      process.exit(0);
    }

    const authPassword = await p.password({
      message: '비밀번호를 입력하세요',
    });

    if (p.isCancel(authPassword)) {
      p.cancel('초기화가 취소되었습니다.');
      process.exit(0);
    }

    username = authUsername;
    password = authPassword;
  }

  const createSchema = await p.confirm({
    message: 'Zod 스키마를 생성할까요?',
    initialValue: false,
  });

  if (p.isCancel(createSchema)) {
    p.cancel('초기화가 취소되었습니다.');
    process.exit(0);
  }

  const configFileName = await p.text({
    message: 'Config 파일명을 입력하세요',
    placeholder: 'swagger/config.ts',
    defaultValue: 'swagger/config.ts',
  });

  if (p.isCancel(configFileName)) {
    p.cancel('초기화가 취소되었습니다.');
    process.exit(0);
  }

  // Config 생성
  const s = p.spinner();
  s.start('설정 파일을 생성하고 있습니다...');

  try {
    const config: InitConfig = {
      uri,
      createSchema,
      username,
      password,
    };

    const configContent = generateConfigTemplate(config);
    const configPath = resolve(process.cwd(), configFileName);

    await writeFileToPath(configPath, configContent);

    s.stop('✅ 설정 파일이 생성되었습니다!');

    const packageManager = detectPackageManager();

    p.note(
      `1. ${pc.green(`${packageManager} run generate-all --config ${configFileName}`)}
2. 생성된 파일들을 프로젝트에서 사용하세요!`,
      '🎯 다음 단계',
    );

    p.note('customOutput 설정을 주석 해제하여 파일 경로를 커스터마이징할 수 있습니다.', '💡 팁');

    p.outro('🎉 설정이 완료되었습니다!');
  } catch (error) {
    s.stop('❌ 설정 파일 생성 중 오류가 발생했습니다.');
    p.log.error(String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    p.log.error(`초기화 중 오류가 발생했습니다: ${error}`);
    process.exit(1);
  });
}
