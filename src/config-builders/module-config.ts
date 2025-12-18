import path from 'node:path';
import { camelCase, pascalCase } from 'es-toolkit';
import type { CodegenConfig } from '../types/codegen-config';
import type { ParsedRoute } from '../types/swagger-typescript-api';
import { generateAlias } from '../utils/path';

export function generateModuleConfig(route: ParsedRoute, config: CodegenConfig) {
  const { aliasInfo } = config.customOutput;
  const { moduleName: _moduleName } = route.raw;
  const moduleName = {
    camelCase: camelCase(_moduleName),
    pascalCase: pascalCase(_moduleName),
  };

  return {
    apiClassName: `${moduleName.pascalCase}Api`,
    apiInstanceName: `${moduleName.camelCase}Api`,
    apiParametersTypeName: `T${moduleName.pascalCase}ApiRequestParameters`,
    utils: {
      resolveRelativeImportPath: resolveRelativeImportPath(aliasInfo.aliasMap, aliasInfo.aliasMapDepth),
    },
  };
}

export function resolveRelativeImportPath(aliasMap: Record<string, string>, maxDepth: number) {
  return ({ fromPath }: { fromPath: string }) => {
    return (importPath: string) => {
      // FSD 레이어 추출 함수
      const extractFsdLayer = (filePath: string): string | null => {
        const fsdLayers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
        for (const layer of fsdLayers) {
          const layerPattern = new RegExp(`/(${layer})/`);
          const match = filePath.match(layerPattern);
          if (match) {
            return match[1];
          }
        }
        return null;
      };

      // fromPath와 importPath 간의 상대 경로 계산
      const fromDir = path.dirname(fromPath);
      const relativePath = path.relative(fromDir, importPath);

      // FSD cross-layer import 체크
      const fromLayer = extractFsdLayer(fromPath);
      const importLayer = extractFsdLayer(importPath);

      // Cross-layer import는 무조건 alias 사용 (FSD 규칙)
      if (fromLayer && importLayer && fromLayer !== importLayer) {
        const aliasPath = generateAlias(importPath, aliasMap);
        if (aliasPath !== importPath.replace(/\.tsx?$/, '')) {
          return aliasPath;
        }
      }

      // 깊이 제한 확인
      const depth = relativePath.split('/').filter((s) => s === '..').length;

      // 깊이 제한을 초과하지 않는 경우 상대 경로 사용
      if (depth <= maxDepth) {
        let finalPath = relativePath.replace(/\.tsx?$/, '').replace(/\\/g, '/');
        if (!finalPath.startsWith('.')) {
          finalPath = `./${finalPath}`;
        }
        return finalPath;
      }

      // 깊이 제한 초과 시 alias 사용
      const aliasPath = generateAlias(importPath, aliasMap);

      // alias 변환이 성공했으면 alias 사용, 실패했으면 상대 경로 사용
      if (aliasPath !== importPath.replace(/\.tsx?$/, '')) {
        return aliasPath;
      }

      // alias 변환 실패 시 상대 경로 반환 (깊이 제한 무시)
      let finalPath = relativePath.replace(/\.tsx?$/, '').replace(/\\/g, '/');
      if (!finalPath.startsWith('.')) {
        finalPath = `./${finalPath}`;
      }
      return finalPath;
    };
  };
}
