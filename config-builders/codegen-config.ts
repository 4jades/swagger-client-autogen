import type { CodegenConfig, InputCodegenConfig } from '../types/codegen-config';
import { log } from '../utils/log';
import { getAbsoluteFilePath } from '../utils/path';

export const setupCodegenConfig = (config: InputCodegenConfig): CodegenConfig => {
  log.info('config 파일을 읽어오고 있어요...');

  const res = {
    ...config,
    customOutput: {
      aliasInfo: {
        aliasMap: config.customOutput?.aliasInfo?.aliasMap ?? { '@': 'src' },
        aliasMapDepth: config.customOutput?.aliasInfo?.aliasMapDepth ?? 2,
      },
      pathInfo: {
        dto: {
          output: buildPathOutput('src/shared/api/dto.ts', config.customOutput?.pathInfo?.dto?.output),
          alias: config.customOutput?.pathInfo?.dto?.alias ?? '@/shared/api/dto',
        },
        api: {
          output: buildPathOutput('src/entities/{moduleName}/api/index.ts', config.customOutput?.pathInfo?.api?.output),
          alias: config.customOutput?.pathInfo?.api?.alias ?? '@/entities/{moduleName}/api/index',
        },
        apiInstance: {
          output: buildPathOutput(
            'src/entities/{moduleName}/api/instance.ts',
            config.customOutput?.pathInfo?.apiInstance?.output,
          ),
          alias: config.customOutput?.pathInfo?.apiInstance?.alias ?? '@/entities/{moduleName}/api/instance',
        },
        queries: {
          output: buildPathOutput(
            'src/entities/{moduleName}/api/queries.ts',
            config.customOutput?.pathInfo?.queries?.output,
          ),
          alias: config.customOutput?.pathInfo?.queries?.alias ?? '@/entities/{moduleName}/api/queries',
        },
        mutations: {
          output: buildPathOutput(
            'src/entities/{moduleName}/api/mutations.ts',
            config.customOutput?.pathInfo?.mutations?.output,
          ),
          alias: config.customOutput?.pathInfo?.mutations?.alias ?? '@/entities/{moduleName}/api/mutations',
        },
        schema: {
          output: buildPathOutput('src/shared/api/schema.gen.ts', config.customOutput?.pathInfo?.schema?.output),
          alias: config.customOutput?.pathInfo?.schema?.alias ?? '@/shared/api/schema.gen',
        },
        apiUtils: {
          output: buildPathOutput('src/shared/api/utils.gen.ts', config.customOutput?.pathInfo?.apiUtils?.output),
          alias: config.customOutput?.pathInfo?.apiUtils?.alias ?? '@/shared/api/utils.gen',
        },
        streamUtils: {
          output: buildPathOutput('src/shared/api/stream.gen.ts', config.customOutput?.pathInfo?.streamUtils?.output),
          alias: config.customOutput?.pathInfo?.streamUtils?.alias ?? '@/shared/api/stream.gen',
        },
        typeGuards: {
          output: buildPathOutput(
            'src/shared/api/type-guards.gen.ts',
            config.customOutput?.pathInfo?.typeGuards?.output,
          ),
          alias: config.customOutput?.pathInfo?.typeGuards?.alias ?? '@/shared/api/type-guards.gen',
        },
        streamHandlers: {
          alias: config.customOutput?.pathInfo?.streamHandlers?.alias ?? '@/entities/{moduleName}/api/stream-handlers',
        },
      },
    },
  };

  // CustomOutput 설정 출력
  log.info('파일 저장 경로:');

  // PathInfo 테이블
  const pathTable = Object.entries(res.customOutput.pathInfo)
    .filter(([key]) => key !== 'streamHandlers')
    .map(([key, value]) => ({
      모듈: key,
      상대경로: 'output' in value ? value.output.relative : '-',
      별칭: value.alias,
    }));
  console.table(pathTable);

  return res;
};

function buildPathOutput(defaultPath: string, relativePath?: string) {
  return {
    relative: relativePath ?? defaultPath,
    absolute: getAbsoluteFilePath(relativePath ?? defaultPath),
  };
}
