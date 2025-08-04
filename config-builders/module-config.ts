import path from "node:path";
import { camelCase, pascalCase } from "es-toolkit";
import type { CodegenConfig } from "../types/codegen-config";
import type { ParsedRoute } from "../types/swagger-typescript-api";

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

export function resolveRelativeImportPath(
	aliasMap: Record<string, string>,
	maxDepth: number,
) {
	return ({ fromPath }: { fromPath: string }) => {
		return (importPath: string) => {
			const matchingAlias = Object.entries(aliasMap).find(([alias]) =>
				importPath.startsWith(`${alias}/`),
			);

			if (!matchingAlias) return importPath;

			const [aliasPrefix, aliasRootPath] = matchingAlias;
			const restPath = importPath.slice(aliasPrefix.length + 1);

			const resolvedImportPath = path.resolve(aliasRootPath, restPath);
			const fromDir = path.dirname(fromPath);
			let relativePath = path.relative(fromDir, resolvedImportPath);

			const depth = relativePath
				.split(path.sep)
				.filter((s) => s === "..").length;

			if (depth > maxDepth) return importPath;

			relativePath = relativePath.replace(/\.tsx?$/, "").replace(/\\/g, "/");
			if (!relativePath.startsWith(".")) {
				relativePath = `./${relativePath}`;
			}

			return relativePath;
		};
	};
}
