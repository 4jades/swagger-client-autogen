import { camelCase, pascalCase } from "es-toolkit";
import type { CodegenConfig } from "../types/codegen-config";
import type { ParsedRoute } from "../types/swagger-typescript-api";

export function generateModuleConfig(route: ParsedRoute, config: CodegenConfig) {
	const { moduleName: _moduleName } = route.raw;
	const moduleName = {
		camelCase: camelCase(_moduleName),
		pascalCase: pascalCase(_moduleName),
	};

	return {
		apiClassName: `${moduleName.pascalCase}Api`,
		apiInstanceName: `${moduleName.camelCase}Api`,
		apiParametersTypeName: `T${moduleName.pascalCase}ApiRequestParameters`,
		codegenConfig: config,
	};
}