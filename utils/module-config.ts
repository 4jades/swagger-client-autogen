import { camelCase, pascalCase } from "es-toolkit";
import type { ParsedRoute } from "../types/swagger-typescript-api";

type ModuleConfig = {
  apiClassName: string;
  apiInstanceName: string;
  apiParametersTypeName: string;
	createSchema: boolean;
};

export function generateModuleConfig(route: ParsedRoute, createSchema: boolean) {
	const { moduleName: _moduleName } = route.raw;
	const moduleName = {
		camelCase: camelCase(_moduleName),
		pascalCase: pascalCase(_moduleName),
	};

	return {
		apiClassName: `${moduleName.pascalCase}Api`,
		apiInstanceName: `${moduleName.camelCase}Api`,
		apiParametersTypeName: `T${moduleName.pascalCase}ApiRequestParameters`,
		createSchema,
	};
}