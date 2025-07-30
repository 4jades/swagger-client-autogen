#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { pascalCase } from "es-toolkit";
import minimist from "minimist";
import { generateApi } from "swagger-typescript-api";
import { generate } from "ts-to-zod";
import { fetchSwagger } from "../utils/fetch-swagger.js";
import { writeFileToPath } from "../utils/file.ts";
import { AnyOfSchemaParser } from "../utils/parser.js";
import { generateConfig } from "../utils/route-config.ts";
import { buildRequestFunctionName } from "../utils/route-utils.ts";
import {
	buildMutationKeyConstanstContent,
	buildMutationKeyConstantsName,
	buildQueryKeyArgs,
	buildQueryKeyArray,
	buildQueryKeyConstantsName,
} from "../utils/tanstack-query-utils.ts";
import { isUrl } from "../utils/url.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseArguments = () => {
	const argv = minimist(process.argv.slice(2), {
		string: [
			"uri",
			"username",
			"password",
			"dto-output-path",
			"api-output-path",
			"api-instance-output-path",
			"query-output-path",
			"mutation-output-path",
			"schema-output-path",
			"stream-output-path",
			"project-template",
		],
		boolean: ["create-schema"],
		alias: {
			u: "uri",
			un: "username",
			pw: "password",
			dp: "dto-output-path",
			ap: "api-output-path",
			aip: "api-instance-output-path",
			qp: "query-output-path",
			mp: "mutation-output-path",
			pt: "project-template",
			sp: "schema-output-path",
			cs: "create-schema",
			so: "stream-output-path",
		},
	});

	return {
		uri: argv.uri,
		username: argv.username,
		password: argv.password,
		dtoOutputPath: argv["dto-output-path"],
		apiOutputPath: argv["api-output-path"],
		apiInstanceOutputPath: argv["api-instance-output-path"],
		queryOutputPath: argv["query-output-path"],
		mutationOutputPath: argv["mutation-output-path"],
		schemaOutputPath: argv["schema-output-path"],
		projectTemplate: argv["project-template"],
		createSchema: argv["create-schema"],
	};
};

const setupOutputPaths = (args) => {
	return {
		dto: {
			relativePath: args.dtoOutputPath ?? "src/shared/api/dto.ts",
			absolutePath: path.resolve(
				process.cwd(),
				args.dtoOutputPath ?? "src/shared/api/dto.ts",
			),
		},
		api: {
			relativePath:
				args.apiOutputPath ?? "src/entities/{moduleName}/api/index.ts",
			absolutePath: path.resolve(
				process.cwd(),
				args.apiOutputPath ?? "src/entities/{moduleName}/api/index.ts",
			),
		},
		apiInstance: {
			relativePath:
				args.apiInstanceOutputPath ??
				"src/entities/{moduleName}/api/instance.ts",
			absolutePath: path.resolve(
				process.cwd(),
				args.apiInstanceOutputPath ??
					"src/entities/{moduleName}/api/instance.ts",
			),
		},
		query: {
			relativePath:
				args.queryOutputPath ?? "src/entities/{moduleName}/api/queries.ts",
			absolutePath: path.resolve(
				process.cwd(),
				args.queryOutputPath ?? "src/entities/{moduleName}/api/queries.ts",
			),
		},
		mutation: {
			relativePath:
				args.mutationOutputPath ?? "src/entities/{moduleName}/api/mutations.ts",
			absolutePath: path.resolve(
				process.cwd(),
				args.mutationOutputPath ?? "src/entities/{moduleName}/api/mutations.ts",
			),
		},
		schema: {
			relativePath: args.schemaOutputPath ?? "src/shared/api/schema.gen.ts",
			absolutePath: path.resolve(
				process.cwd(),
				args.schemaOutputPath ?? "src/shared/api/schema.gen.ts",
			),
		},
		dtoGen: {
			relativePath: "src/shared/api/dto.gen.ts",
			absolutePath: path.resolve(process.cwd(), "src/shared/api/dto.gen.ts"),
		},
	};
};

const printUsage = (outputPaths) => {
	console.error(
		"❗️ Error: Please provide the swagger URL or swagger file name",
	);
	console.error(
		"Usage: node generate-all.js --uri <swagger-url|swagger-file-name> " +
			"[--username <username>] [--password <password>] " +
			"[--dto-output-path <dto-output-path>] " +
			"[--api-output-path <api-output-path>] " +
			"[--query-output-path <query-output-path>] " +
			"[--mutation-output-path <mutation-output-path>] " +
			"[--schema-output-path <schema-output-path>] " +
			"[--project-template <project-template>]" +
			"[--create-schema]",
	);
	console.error(
		`Current output paths:
DTO Path: ${outputPaths.dto.relativePath}
API Path: ${outputPaths.api.relativePath}
Query Path: ${outputPaths.query.relativePath}
Mutation Path: ${outputPaths.mutation.relativePath}
Project Template Path: ${outputPaths.projectTemplate}
Schema Path: ${outputPaths.schema.relativePath}
`,
	);
};

export const generateApiCode = async ({
	uri,
	username,
	password,
	templates,
	...params
}) => {
	const isLocal = !isUrl(uri);

	return generateApi({
		input: isLocal ? path.resolve(process.cwd(), uri) : undefined,
		spec: !isLocal && (await fetchSwagger(uri, username, password)),
		templates: templates,
		generateClient: true,
		generateUnionEnums: true,
		cleanOutput: false,
		silent: true,
		modular: true,
		moduleNameFirstTag: true,
		moduleNameIndex: 1,
		typeSuffix: "Dto",
		generateRouteTypes: true,
		schemaParsers: {
			complexAnyOf: AnyOfSchemaParser,
		},
		...params,
	});
};

const generateApiFunctionCode = async (args, outputPaths) => {
	const { projectTemplate, createSchema, uri, username, password } = args;
	const templatePath = projectTemplate
		? path.resolve(process.cwd(), projectTemplate)
		: createSchema
			? path.resolve(__dirname, "../templates/schema")
			: path.resolve(__dirname, "../templates");

	const apiFunctionCode = await generateApiCode({
		uri,
		username,
		password,
		templates: templatePath,
		hooks: {
			onCreateRouteName: (routeNameInfo, rawRouteInfo) => {
				return {
					...routeNameInfo,
					usage: buildRequestFunctionName(rawRouteInfo),
				};
			},
			onCreateRoute: (route) => {
				const { routeName } = route;
				const { moduleName } = route.raw;
				const routeConfig = generateConfig(route);

				return {
					...route,
					customeMeta: {
						requestFunctionParameter:
							routeConfig.request.parameters.signatures.all.join(", "),
						requestArgs:
							routeConfig.request.parameters.arguments.all.join(", "),
						apiClassName: `${pascalCase(moduleName)}Api`,
						requestFunctionName: routeName.usage,
						responseDtoName: route.response.type,
						apiParametersTypeName: `T${pascalCase(moduleName)}ApiRequestParameters`,
						responseSchemaExpression: routeConfig.response.schema.expression,
					},
				};
			},
		},
	});

	for (const { fileName, fileContent } of apiFunctionCode.files) {
		if (fileName === "http-client") continue;

		if (fileName === "data-contracts") {
			await writeFileToPath(outputPaths.dto.absolutePath, fileContent);
		} else {
			const moduleName = fileName.replace("Route", "").toLowerCase();

			if (fileName.match(/Route$/)) {
				const output = outputPaths.apiInstance.absolutePath.replace(
					"{moduleName}",
					moduleName,
				);
				await writeFileToPath(output, fileContent);
			} else {
				const output = outputPaths.api.absolutePath.replace(
					"{moduleName}",
					moduleName,
				);
				await writeFileToPath(output, fileContent);
			}
		}
	}
};

const generateTanstackQueryCode = async (args, outputPaths) => {
	const { projectTemplate, uri, username, password } = args;
	const templatePath = projectTemplate
		? path.resolve(process.cwd(), projectTemplate, "tanstack-query")
		: path.resolve(__dirname, "../templates/tanstack-query");

	const tanstackQueryCode = await generateApiCode({
		uri,
		username,
		password,
		templates: templatePath,
		templateInfos: [
			{ name: "api", fileName: "queries" },
			{ name: "routeTypes", fileName: "mutations" },
			{ name: "dataContractJsDoc", fileName: "data-contract-jsdoc" },
			{ name: "interfaceDataContract", fileName: "interface-data-contract" },
			{ name: "typeDataContract", fileName: "type-data-contract" },
			{ name: "enumDataContract", fileName: "enum-data-contract" },
			{ name: "objectFieldJsDoc", fileName: "object-field-jsdoc" },
			{ name: "httpClient", fileName: "http-client" },
			{ name: "routeName", fileName: "route-name" },
		],
		hooks: {
			onCreateRouteName: (routeNameInfo, rawRouteInfo) => {
				return {
					...routeNameInfo,
					usage: buildRequestFunctionName(rawRouteInfo),
				};
			},
			onCreateRoute: (route) => {
				const { routeName } = route;
				const { moduleName } = route.raw;
				const routeConfig = generateConfig(route);
				const pascalCaseRouteName = pascalCase(routeName.usage);

				// const saveRoute = async (route) => {
				// 	await writeFileToPath(
				// 		`/Users/user/WebstormProjects/swagger-client-autogen/${routeName.usage}.json`,
				// 		JSON.stringify(
				// 			route,
				// 			(() => {
				// 				const seen = new WeakSet();
				// 				return (key, value) => {
				// 					if (typeof value === "object" && value !== null) {
				// 						if (seen.has(value)) {
				// 							return "[Circular]";
				// 						}
				// 						seen.add(value);
				// 					}
				// 					return value;
				// 				};
				// 			})(),
				// 			2,
				// 		),
				// 	);
				// };

				// if (route.raw.operationId === "get_chats_chats_get") {
				// 	await saveRoute(route);
				// } else if (
				// 	route.raw.operationId ===
				// 	"submit_problem_problems__problem_id__submit_post"
				// ) {
				// 	await saveRoute(route);
				// } else if (
				// 	route.raw.operationId === "init_options_chats_init_options_get"
				// ) {
				// 	console.log(routeConfig);
				// 	route.responseBodyInfo;
				// 	await saveRoute(route);
				// } else if (
				// 	route.raw.operationId === "delete_chat_chats__chat_id__delete"
				// ) {
				// 	await saveRoute(route);
				// }

				// console.log(routeConfig.request.parameters.signatures.required);

				return {
					...route,
					customeMeta: {
						requestFunctionParameter:
							routeConfig.request.parameters.signatures.all.join(", "),
						requestArgs:
							routeConfig.request.parameters.arguments.all.join(", "),
						apiInstanceName: `${moduleName}Api`,
						requestFunctionName: routeName.usage,
						responseDtoName: route.response.type,
						apiParametersTypeName: `T${pascalCase(moduleName)}ApiRequestParameters`,
						queryHookMeta: {
							queryKeyArgs: buildQueryKeyArgs(routeConfig),
							queryKeyObjectName: `${moduleName.toUpperCase()}_QUERY_KEY`,
							queryKeyConstanstName: buildQueryKeyConstantsName(route),
							queryKeyConstanstFunction: `(${routeConfig.request.parameters.signatures.required.join(", ")})=>${buildQueryKeyArray(route)}`,
							queryHookName: `use${pascalCaseRouteName}Query`,
							suspenseQueryHookName: `use${pascalCaseRouteName}SuspenseQuery`,
						},
						mutationHookMeta: {
							mutationKeyObjectName: `${moduleName.toUpperCase()}_MUTATION_KEY`,
							mutationKeyConstanstName: buildMutationKeyConstantsName(route),
							mutationKeyConstanstContent:
								buildMutationKeyConstanstContent(route),
							mutationHookName: `use${pascalCaseRouteName}Mutation`,
						},
					},
				};
			},
		},
	});

	for (const { fileName, fileContent } of tanstackQueryCode.files) {
		if (fileName === "http-client" || fileName === "data-contracts") continue;

		/**
		 * @description: 파일명이 고정돼서 생성되기 때문에 수동으로 변환함
		 * @see: https://github.com/acacode/swagger-typescript-api/blob/a9cb2f8388083330d7f28871788885cc9de145d3/src/code-gen-process.ts#L418
		 */
		const moduleName = fileName.replace("Route", "").toLowerCase();

		if (fileName.match(/Route$/)) {
			const output = outputPaths.mutation.absolutePath.replace(
				"{moduleName}",
				moduleName,
			);
			await writeFileToPath(output, fileContent);
		} else {
			const output = outputPaths.query.absolutePath.replace(
				"{moduleName}",
				moduleName,
			);
			await writeFileToPath(output, fileContent);
		}
	}
};

const generateSchemaCode = async (args, outputPaths) => {
	const { projectTemplate, uri, username, password } = args;
	const templatePath = projectTemplate
		? path.resolve(process.cwd(), projectTemplate)
		: path.resolve(__dirname, "../templates/schema");

	const apiFunctionCode = await generateApiCode({
		uri,
		username,
		password,
		templates: templatePath,
		extraTemplates: [
			{
				name: "api-utils",
				path: projectTemplate
					? path.resolve(process.cwd(), projectTemplate, "api-utils.ejs")
					: path.resolve(__dirname, "../templates/schema/api-utils.ejs"),
			},
			{
				name: "stream-utils",
				path: projectTemplate
					? path.resolve(process.cwd(), projectTemplate, "stream-utils.ejs")
					: path.resolve(__dirname, "../templates/schema/stream-utils.ejs"),
			},
			{
				name: "type-guards",
				path: projectTemplate
					? path.resolve(process.cwd(), projectTemplate, "type-guards.ejs")
					: path.resolve(__dirname, "../templates/schema/type-guards.ejs"),
			},
		],
		schemaParsers: {},
	});

	for (const { fileName, fileContent } of apiFunctionCode.files) {
		if (fileName === "http-client") continue;

		if (fileName === "data-contracts") {
			const schema = generate({ sourceText: fileContent });
			await writeFileToPath(
				path.resolve(process.cwd(), outputPaths.schema.relativePath),
				schema
					.getZodSchemasFile()
					.replaceAll("datetime()", "datetime({ offset: true })"),
			);
		}

		if (fileName === "stream-utils") {
			await writeFileToPath(
				path.resolve(process.cwd(), "src/shared/api/stream.gen.ts"),
				fileContent,
			);
		}

		if (fileName === "api-utils") {
			await writeFileToPath(
				path.resolve(process.cwd(), "src/shared/api/utils.gen.ts"),
				fileContent,
			);
		}

		if (fileName === "type-guards") {
			await writeFileToPath(
				path.resolve(process.cwd(), "src/shared/api/type-guards.gen.ts"),
				fileContent,
			);
		}
	}
};

const main = async () => {
	const args = parseArguments();
	const outputPaths = setupOutputPaths(args);

	if (!args.uri) {
		printUsage(outputPaths);
		process.exit(1);
	}

	try {
		// args.createSchema && (await generateSchemaCode(args, outputPaths));
		await generateApiFunctionCode(args, outputPaths);
		await generateTanstackQueryCode(args, outputPaths);
	} catch (e) {
		console.error(e);
	}
};

main();
