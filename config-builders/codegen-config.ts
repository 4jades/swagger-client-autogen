import type { CodegenConfig, InputCodegenConfig } from '../types/codegen-config';
import { getAbsoluteFilePath } from '../utils/path';

export const setupCodegenConfig = (config: InputCodegenConfig): CodegenConfig => {
  return {
    ...config,
    customOutput: {
      aliasInfo: {
        aliasMap: config.customOutput?.aliasInfo?.aliasMap ?? { '@': 'src' },
        aliasMapDepth: config.customOutput?.aliasInfo?.aliasMapDepth ?? 2,
      },
      pathInfo: {
        dto: {
          output: buildPathOutput('src/shared/api/dto.ts', config.customOutput?.pathInfo?.dto?.output),
          alias: '@/shared/api/dto',
        },
        api: {
          output: buildPathOutput('src/entities/{moduleName}/api/index.ts', config.customOutput?.pathInfo?.api?.output),
          alias: '@/entities/{moduleName}/api/index',
        },
        apiInstance: {
          output: buildPathOutput(
            'src/entities/{moduleName}/api/instance.ts',
            config.customOutput?.pathInfo?.apiInstance?.output,
          ),
          alias: '@/entities/{moduleName}/api/instance',
        },
        queries: {
          output: buildPathOutput(
            'src/entities/{moduleName}/api/queries.ts',
            config.customOutput?.pathInfo?.queries?.output,
          ),
          alias: '@/entities/{moduleName}/api/queries',
        },
        mutations: {
          output: buildPathOutput(
            'src/entities/{moduleName}/api/mutations.ts',
            config.customOutput?.pathInfo?.mutations?.output,
          ),
          alias: '@/entities/{moduleName}/api/mutations',
        },
        schema: {
          output: buildPathOutput('src/shared/api/schema.gen.ts', config.customOutput?.pathInfo?.schema?.output),
          alias: '@/shared/api/schema.gen',
        },
        apiUtils: {
          output: buildPathOutput('src/shared/api/utils.gen.ts', config.customOutput?.pathInfo?.apiUtils?.output),
          alias: '@/shared/api/utils.gen',
        },
        streamUtils: {
          output: buildPathOutput('src/shared/api/stream.gen.ts', config.customOutput?.pathInfo?.streamUtils?.output),
          alias: '@/shared/api/stream.gen',
        },
        typeGuards: {
          output: buildPathOutput(
            'src/shared/api/type-guards.gen.ts',
            config.customOutput?.pathInfo?.typeGuards?.output,
          ),
          alias: '@/shared/api/type-guards.gen',
        },
        streamHandlers: {
          alias: '@/entities/{moduleName}/api/stream-handlers',
        },
      },
    },
  };
};

function buildPathOutput(defaultPath: string, relativePath?: string) {
  return {
    relative: relativePath ?? defaultPath,
    absolute: getAbsoluteFilePath(relativePath ?? defaultPath),
  };
}
