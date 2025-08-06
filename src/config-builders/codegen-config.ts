import type { CodegenConfig, InputCodegenConfig } from '../types/codegen-config';
import { log } from '../utils/log';
import { generateAlias, getAbsoluteFilePath } from '../utils/path';

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
          output: buildPathOutput('src/shared/api/dto.ts', config.customOutput?.pathInfo?.dto),
        },
        api: {
          output: buildPathOutput('src/entities/{moduleName}/api/index.ts', config.customOutput?.pathInfo?.api),
        },
        apiInstance: {
          output: buildPathOutput(
            'src/entities/{moduleName}/api/instance.ts',
            config.customOutput?.pathInfo?.apiInstance,
          ),
        },
        queries: {
          output: buildPathOutput('src/entities/{moduleName}/api/queries.ts', config.customOutput?.pathInfo?.queries),
        },
        mutations: {
          output: buildPathOutput(
            'src/entities/{moduleName}/api/mutations.ts',
            config.customOutput?.pathInfo?.mutations,
          ),
        },
        schema: {
          output: buildPathOutput('src/shared/api/schema.gen.ts', config.customOutput?.pathInfo?.schema),
        },
        apiUtils: {
          output: buildPathOutput('src/shared/api/utils.gen.ts', config.customOutput?.pathInfo?.apiUtils),
        },
        streamUtils: {
          output: buildPathOutput('src/shared/api/stream.gen.ts', config.customOutput?.pathInfo?.streamUtils),
        },
        typeGuards: {
          output: buildPathOutput('src/shared/api/type-guards.gen.ts', config.customOutput?.pathInfo?.typeGuards),
        },
        streamHandlers: {
          output: buildPathOutput(
            'src/entities/{moduleName}/api/stream-handlers',
            config.customOutput?.pathInfo?.streamHandlers,
          ),
        },
      },
    },
  };

  // CustomOutput 설정 출력
  log.info('파일 저장 경로:');

  // PathInfo 테이블
  const pathTable = Object.entries(res.customOutput.pathInfo).map(([key, value]) => ({
    모듈: key,
    상대경로: value.output.relative,
    별칭: generateAlias(value.output.relative, res.customOutput.aliasInfo.aliasMap),
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
