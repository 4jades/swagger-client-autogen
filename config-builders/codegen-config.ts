import type { CodegenConfig, InputCodegenConfig } from "../types/codegen-config";
import { getAbsoluteFilePath } from "../utils/path.ts";

export const setupCodegenConfig = (config: InputCodegenConfig): CodegenConfig => {
	return {
		...config,
		customOutput: {
			aliasInfo: {
				aliasMap: config.customOutput?.aliasInfo?.aliasMap ?? { "@": "src" },
				aliasMapDepth: config.customOutput?.aliasInfo?.aliasMapDepth ?? 2,
			},
			pathInfo: {
				dto: {
					output: {
						relative:
							config.customOutput?.pathInfo?.dto?.output ??
							"src/shared/api/dto.ts",
						absolute: getAbsoluteFilePath(
							config.customOutput?.pathInfo?.dto?.output ??
								"src/shared/api/dto.ts",
						),
					},
					alias: "@/shared/api/dto",
				},
				api: {
					output: {
						relative:
							config.customOutput?.pathInfo?.api?.output ??
							"src/entities/{moduleName}/api/index.ts",
						absolute: getAbsoluteFilePath(
							config.customOutput?.pathInfo?.api?.output ??
								"src/entities/{moduleName}/api/index.ts",
						),
					},
					alias: "@/entities/{moduleName}/api/index",
				},
				apiInstance: {
					output: {
						relative:
							config.customOutput?.pathInfo?.apiInstance?.output ??
							"src/entities/{moduleName}/api/instance.ts",
						absolute: getAbsoluteFilePath(
							config.customOutput?.pathInfo?.apiInstance?.output ??
								"src/entities/{moduleName}/api/instance.ts",
						),
					},
					alias: "@/entities/{moduleName}/api/instance",
				},
				queries: {
					output: {
						relative:
							config.customOutput?.pathInfo?.queries?.output ??
							"src/entities/{moduleName}/api/queries.ts",
						absolute: getAbsoluteFilePath(
							config.customOutput?.pathInfo?.queries?.output ??
								"src/entities/{moduleName}/api/queries.ts",
						),
					},
					alias: "@/entities/{moduleName}/api/queries",
				},
				mutations: {
					output: {
						relative:
							config.customOutput?.pathInfo?.mutations?.output ??
							"src/entities/{moduleName}/api/mutations.ts",
						absolute: getAbsoluteFilePath(
							config.customOutput?.pathInfo?.mutations?.output ??
								"src/entities/{moduleName}/api/mutations.ts",
						),
					},
					alias: "@/entities/{moduleName}/api/mutations",
				},
				schema: {
					output: {
						relative:
							config.customOutput?.pathInfo?.schema?.output ??
							"src/shared/api/schema.gen.ts",
						absolute: getAbsoluteFilePath(
							config.customOutput?.pathInfo?.schema?.output ??
								"src/shared/api/schema.gen.ts",
						),
					},
					alias: "@/shared/api/schema.gen",
				},
			},
		},
	};
};