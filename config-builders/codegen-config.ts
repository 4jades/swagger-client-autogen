import type { CodegenConfig, InputCodegenConfig } from "../types/codegen-config";
import { getAbsoluteFilePath } from "../utils/path.ts";

export const setupCodegenConfig = (config: InputCodegenConfig): CodegenConfig => {
	return {
		...config,
		outputMap: {
			dto: {
				output: getAbsoluteFilePath(config.outputMap?.dto?.output ?? "src/shared/api/dto.ts"),
				alias: "@/shared/api/dto.ts",
			},
			api: {
				output: getAbsoluteFilePath(config.outputMap?.api?.output ?? "src/entities/{moduleName}/api/index.ts"),
				alias: "@/entities/{moduleName}/api/index.ts",
			},
			apiInstance: {
				output: getAbsoluteFilePath(config.outputMap?.apiInstance?.output ?? "src/entities/{moduleName}/api/instance.ts"),
				alias: "@/entities/{moduleName}/api/instance.ts",
			},
			query: {
				output: getAbsoluteFilePath(config.outputMap?.query?.output ?? "src/entities/{moduleName}/api/queries.ts"),
				alias: "@/entities/{moduleName}/api/queries.ts",
			},
			mutation: {
				output: getAbsoluteFilePath(config.outputMap?.mutation?.output ?? "src/entities/{moduleName}/api/mutations.ts"),
				alias: "@/entities/{moduleName}/api/mutations.ts",
			},
			schema: {
				output: getAbsoluteFilePath(config.outputMap?.schema?.output ?? "src/shared/api/schema.gen.ts"),
				alias: "@/shared/api/schema.gen.ts",
			},
			dtoGen: {
				output: "src/dto.gen.ts"
			},
		}
	};
};