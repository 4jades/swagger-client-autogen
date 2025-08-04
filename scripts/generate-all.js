#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { pascalCase } from "es-toolkit";
import minimist from "minimist";
import { generate } from "ts-to-zod";
import { setupCodegenConfig } from "../config-builders/codegen-config.ts";
import { generateModuleConfig } from "../config-builders/module-config.ts";
import { generateConfig } from "../config-builders/route-config.ts";
import { writeFileToPath } from "../utils/file.ts";
import { buildRequestFunctionName } from "../utils/route-utils.ts";
import { generateApiCode } from "../utils/swagger-typescript-api.ts";
import {
	buildMutationKeyConstanstContent,
	buildMutationKeyConstantsName,
	buildQueryKeyArgs,
	buildQueryKeyArray,
	buildQueryKeyConstantsName,
} from "../utils/tanstack-query-utils.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseArguments = () => {
	const argv = minimist(process.argv.slice(2), {
		string: ["config"],
		alias: {
			c: "config",
		},
	});

	return {
		configPath: argv.config ?? "swagger-client-autogen.config.ts",
	};
};

const loadConfig = async (configPath) => {
	try {
		const configModule = await import(path.resolve(process.cwd(), configPath));
		return setupCodegenConfig(configModule.config);
	} catch (error) {
		console.error(`❌ 설정 파일을 불러올 수 없습니다: ${configPath}`);
		console.error(error.message);
		process.exit(1);
	}
};

const printUsage = () => {
	console.error(
		"❗️ Error: Please provide the swagger URL or swagger file name",
	);
	console.error("Usage: node generate-all.js [--config <config-file-path>]");
	console.error("Default config file: swagger-client-autogen.config.ts");
};


const generateApiFunctionCode = async (config) => {
	const { projectTemplate, uri, username, password } = config;
	const templatePath = projectTemplate
		? path.resolve(process.cwd(), projectTemplate)
		: path.resolve(__dirname, "../templates");

	const apiFunctionCode = await generateApiCode({
		uri,
		username,
		password,
		templates: templatePath,
		templateInfos: [
			{ name: "api", fileName: "api" },
			{ name: "routeTypes", fileName: "api-instance" },
			{ name: "dataContracts", fileName: "data-contracts" },
			/**
			 * @description: 아래 값들은 사용되지 않지만, 모든 templateInfos 값을 넣어야 하기 때문에 기본값으로 추가함
			 */
			{ name: "dataContractJsDoc", fileName: "data-contract-jsdoc" },
			{ name: "objectFieldJsDoc", fileName: "object-field-jsdoc" },
			{ name: "interfaceDataContract", fileName: "interface-data-contract" },
			{ name: "typeDataContract", fileName: "type-data-contract" },
			{ name: "enumDataContract", fileName: "enum-data-contract" },
			{ name: "httpClient", fileName: "http-client" },
		],
		hooks: {
			onCreateRouteName: (routeNameInfo, rawRouteInfo) => {
				return {
					...routeNameInfo,
					usage: buildRequestFunctionName(rawRouteInfo),
				};
			},
			onCreateRoute: (route) => {
				const routeConfig = generateConfig(route);
				const moduleConfig = generateModuleConfig(route, config);

				return {
					...route,
					routeConfig,
					moduleConfig,
					codegenConfig: config,
				};
			},
		},
	});

	for (const { fileName, fileContent } of apiFunctionCode.files) {
		if (fileName === "http-client") continue;

		const { pathInfo } = config.customOutput;

		if (fileName === "data-contracts") {
			await writeFileToPath(pathInfo.dto.output.absolute, fileContent);
		} else {
			const moduleName = fileName.replace("Route", "").toLowerCase();

			if (fileName.match(/Route$/)) {
				const output = pathInfo.apiInstance.output.absolute.replace(
					"{moduleName}",
					moduleName,
				);
				await writeFileToPath(output, fileContent);
			} else {
				const output = pathInfo.api.output.absolute.replace("{moduleName}", moduleName);
				await writeFileToPath(output, fileContent);
			}
		}
	}
};

const generateTanstackQueryCode = async (config) => {
	const { projectTemplate, uri, username, password } = config;
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
			{ name: "dataContracts", fileName: "data-contracts" },
			/**
			 * @description: 아래 값들은 사용되지 않지만, 모든 templateInfos 값을 넣어야 하기 때문에 기본값으로 추가함
			 */
			{ name: "dataContractJsDoc", fileName: "data-contract-jsdoc" },
			{ name: "interfaceDataContract", fileName: "interface-data-contract" },
			{ name: "typeDataContract", fileName: "type-data-contract" },
			{ name: "enumDataContract", fileName: "enum-data-contract" },
			{ name: "objectFieldJsDoc", fileName: "object-field-jsdoc" },
			{ name: "httpClient", fileName: "http-client" },
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
				const moduleConfig = generateModuleConfig(route, config);
				const pascalCaseRouteName = pascalCase(routeName.usage);

				return {
					...route,
					routeConfig,
					codegenConfig: config,
					moduleConfig: {
						...moduleConfig,
						query: {
							queryKeyObjectName: `${moduleName.toUpperCase()}_QUERY_KEY`,
						},
						mutation: {
							mutationKeyObjectName: `${moduleName.toUpperCase()}_MUTATION_KEY`,
						},
					},
					hookConfig: {
						query: {
							queryKeyArgs: buildQueryKeyArgs(routeConfig),
							queryKeyConstanstName: buildQueryKeyConstantsName(route),
							queryKeyConstanstFunction: `(${routeConfig.request.parameters.signatures.required.join(", ")})=>${buildQueryKeyArray(route)}`,
							queryHookName: `use${pascalCaseRouteName}Query`,
							suspenseQueryHookName: `use${pascalCaseRouteName}SuspenseQuery`,
						},
						mutation: {
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

		const { pathInfo } = config.customOutput;

		/**
		 * @description: 파일명이 고정돼서 생성되기 때문에 수동으로 변환함
		 * @see: https://github.com/acacode/swagger-typescript-api/blob/a9cb2f8388083330d7f28871788885cc9de145d3/src/code-gen-process.ts#L418
		 */
		const moduleName = fileName.replace("Route", "").toLowerCase();

		if (fileName.match(/Route$/)) {
			const output = pathInfo.mutations.output.absolute.replace(
				"{moduleName}",
				moduleName,
			);
			await writeFileToPath(output, fileContent);
		} else {
			const output = pathInfo.queries.output.absolute.replace(
				"{moduleName}",
				moduleName,
			);
			await writeFileToPath(output, fileContent);
		}
	}
};

const generateSchemaCode = async (config) => {
	const { projectTemplate, uri, username, password } = config;
	const templatePath = projectTemplate
		? path.resolve(process.cwd(), projectTemplate)
		: path.resolve(__dirname, "../templates");

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
					: path.resolve(__dirname, "../templates/api-utils.ejs"),
			},
			{
				name: "stream-utils",
				path: projectTemplate
					? path.resolve(process.cwd(), projectTemplate, "stream-utils.ejs")
					: path.resolve(__dirname, "../templates/stream-utils.ejs"),
			},
			{
				name: "type-guards",
				path: projectTemplate
					? path.resolve(process.cwd(), projectTemplate, "type-guards.ejs")
					: path.resolve(__dirname, "../templates/type-guards.ejs"),
			},
		],
		schemaParsers: {},
		hooks: {
			onCreateRoute: (route) => {
				const routeConfig = generateConfig(route);
				const moduleConfig = generateModuleConfig(route, config);

				return {
					...route,
					routeConfig,
					moduleConfig,
					codegenConfig: config,
				};
			},
		},
	});

	for (const { fileName, fileContent } of apiFunctionCode.files) {
		if (fileName === "http-client") continue;

		const { pathInfo } = config.customOutput;

		if (fileName === "data-contracts") {
			const schema = generate({ sourceText: fileContent });
			await writeFileToPath(
				path.resolve(process.cwd(), pathInfo.schema.output.absolute),
				schema
					.getZodSchemasFile()
					.replaceAll("datetime()", "datetime({ offset: true })"),
			);
		}

		//TODO 이부분도 config로 입력 받을 수 있게 수정하기
		const outputPath = {
			"stream-utils": config.customOutput.pathInfo.streamUtils.output.absolute,
			"api-utils": config.customOutput.pathInfo.apiUtils.output.absolute,
			"type-guards": config.customOutput.pathInfo.typeGuards.output.absolute,
		}[fileName];

		if (outputPath) {
			await writeFileToPath(outputPath, fileContent);
		}
	}
};

const main = async () => {
	const args = parseArguments();
	const config = await loadConfig(args.configPath);

	if (!config.uri) {
		printUsage();
		process.exit(1);
	}

	try {
		config.createSchema && (await generateSchemaCode(config));
		await generateApiFunctionCode(config);
		await generateTanstackQueryCode(config);
	} catch (e) {
		console.error(e);
	}
};

main();
