import { camelCase, compact, pascalCase } from "es-toolkit";
import type { ParsedRoute } from "../types/swagger-typescript-api";
import { pipe } from "./fp.ts";

type RouteConfig = {
	request: {
		pathParams: {
			signatures: string[];
			arguments: string[];
		};
		query: {
			dtoName: string | null;
		};
		headers: {
			dtoName: string | null;
		};
		payload: {
			dtoName: string | null;
		};
		options: {
			typeExpr: string | null;
		};
		parameters: {
			signatures: {
				required: string[];
				all: string[];
			};
			arguments: {
				required: string[];
				all: string[];
			};
		};
		schema: {
			expression: string | null;
		};
	};
	response: {
		dtoName: string | null;
		schema: {
			expression: string | null;
		};
	};
};

export function generateConfig(route: ParsedRoute) {
	const configMutators = withRoute(route);
	const initialRouteConfig: RouteConfig = {
		request: {
			pathParams: {
				signatures: new Array<string>(),
				arguments: new Array<string>(),
			},
			query: {
				dtoName: "",
			},
			headers: {
				dtoName: "",
			},
			payload: {
				dtoName: "",
			},
			options: {
				typeExpr: "",
			},
			parameters: {
				signatures: {
					required: new Array<string>(),
					all: new Array<string>(),
				},
				arguments: {
					required: new Array<string>(),
					all: new Array<string>(),
				},
			},
			schema: {
				expression: null,
			},
		},
		response: {
			dtoName: "",
			schema: {
				expression: null,
			},
		},
	};

	return pipe(
		configMutators.setPathParamsSignatures,
		configMutators.setPathParamsArguments,
		configMutators.setQueryParamsDtoName,
		configMutators.setHeaderDtoName,
		configMutators.setPayloadDtoName,
		configMutators.setRequestFunctionOptionsTypeExpression,
		configMutators.setRequestRequiredSignatures,
		configMutators.setRequestAllSignatures,
		configMutators.setRequestRequiredArguments,
		configMutators.setRequestAllArguments,
		configMutators.setResponseDtoName,
		configMutators.setRequestSchemaExpression,
		configMutators.setResponseSchemaExpression,
	)(initialRouteConfig);
}

function withRoute(route: ParsedRoute) {
	return {
		setPathParamsSignatures: (config: RouteConfig): RouteConfig => {
			const { parameters } = route.request;

			return {
				...config,
				request: {
					...config.request,
					pathParams: {
						...config.request.pathParams,
						signatures:
							parameters?.map((parameter) => {
								return compact([
									parameter.name,
									parameter.optional && "?",
									":",
									parameter.type,
								]).join("");
							}) ?? [],
					},
				},
			};
		},
		setPathParamsArguments: (config: RouteConfig): RouteConfig => {
			const { parameters } = route.request;

			return {
				...config,
				request: {
					...config.request,
					pathParams: {
						...config.request.pathParams,
						arguments:
							parameters?.map((parameter) => {
								return parameter.name as unknown as string;
							}) ?? [],
					},
				},
			};
		},
		setQueryParamsDtoName: (config: RouteConfig): RouteConfig => {
			const { request, routeName } = route;

			return {
				...config,
				request: {
					...config.request,
					query: {
						...config.request.query,
						dtoName: request.query
							? pascalCase(`${routeName.original}QueryParams`)
							: null,
					},
				},
			};
		},
		setHeaderDtoName: (config: RouteConfig): RouteConfig => {
			const { request, routeName } = route;

			return {
				...config,
				request: {
					...config.request,
					headers: {
						...config.request.headers,
						dtoName: request.headers
							? pascalCase(`${routeName.original}Headers`)
							: null,
					},
				},
			};
		},
		setPayloadDtoName: (config: RouteConfig): RouteConfig => {
			return {
				...config,
				request: {
					...config.request,
					payload: {
						...config.request.payload,
						dtoName: route.specificArgs?.body?.type,
					},
				},
			};
		},
		setRequestFunctionOptionsTypeExpression: (
			config: RouteConfig,
		): RouteConfig => {
			const { request } = route;

			return {
				...config,
				request: {
					...config.request,
					options: {
						...config.request.options,
						typeExpr: request.headers
							? `Omit<Options, 'headers'> & { headers: ${config.request.headers.dtoName} }`
							: "Options",
					},
				},
			};
		},
		setRequestRequiredSignatures: (config: RouteConfig): RouteConfig => {
			const inlineQueryParamsParameter =
				route.request.query &&
				compact([
					"params",
					route.request.query.optional && "?",
					": ",
					config.request.query.dtoName,
				]).join("");

			const inlinePayloadParameter =
				route.request.payload &&
				compact([
					"payload",
					route.request.payload.optional && "?",
					": ",
					config.request.payload.dtoName,
				]).join("");

			return {
				...config,
				request: {
					...config.request,
					parameters: {
						...config.request.parameters,
						signatures: {
							...config.request.parameters.signatures,
							required: compact([
								...config.request.pathParams.signatures,
								inlineQueryParamsParameter,
								inlinePayloadParameter,
							]),
						},
					},
				},
			};
		},
		setRequestAllSignatures: (config: RouteConfig): RouteConfig => {
			return {
				...config,
				request: {
					...config.request,
					parameters: {
						...config.request.parameters,
						signatures: {
							...config.request.parameters.signatures,
							all: compact([
								...config.request.parameters.signatures.required,
								"kyInstance?: KyInstance",
								`options?: ${config.request.options.typeExpr}`,
							]),
						},
					},
				},
			};
		},
		setRequestRequiredArguments: (config: RouteConfig): RouteConfig => {
			const inlineQueryParamsArgs = route.request.query && "params";
			const inlinePayloadArgs = route.request.payload && "payload";

			return {
				...config,
				request: {
					...config.request,
					parameters: {
						...config.request.parameters,
						arguments: {
							...config.request.parameters.arguments,
							required: compact([
								...config.request.pathParams.arguments,
								inlineQueryParamsArgs,
								inlinePayloadArgs,
							]),
						},
					},
				},
			};
		},
		setRequestAllArguments: (config: RouteConfig): RouteConfig => {
			return {
				...config,
				request: {
					...config.request,
					parameters: {
						...config.request.parameters,
						arguments: {
							...config.request.parameters.arguments,
							all: compact([
								...config.request.parameters.arguments.required,
								"kyInstance",
								"options",
							]),
						},
					},
				},
			};
		},
		setResponseDtoName: (config: RouteConfig): RouteConfig => {
			return {
				...config,
				response: {
					...config.response,
					dtoName: route.response.type ?? null,
				},
			};
		},
		setRequestSchemaExpression: (config: RouteConfig): RouteConfig => {
			return {
				...config,
				response: {
					...config.response,
					schema: {
						...config.response.schema,
						expression: "",
					},
				},
			};
		},
		setResponseSchemaExpression: (config: RouteConfig): RouteConfig => {
			const { responseBodyInfo, response } = route;
			const camelCaseDtoName = camelCase(config.response.dtoName ?? "");

			const isList = Boolean(
				responseBodyInfo?.responses.find((v) => v.isSuccess)?.content?.[
					"application/json"
				]?.schema?.type === "array",
			);
			const isDiscriminatedUnion = Boolean(
				responseBodyInfo?.responses.find((v) => v.isSuccess)?.content?.[
					"application/json"
				]?.schema?.discriminator,
			);

			const isValidType = (type) => {
				const invalidTypes = [
					"void",
					"any",
					"null",
					"undefined",
					"object",
					"string",
				];
				const invalidPattern = new RegExp(invalidTypes.join("|"), "i");
				return type && !invalidPattern.test(type);
			};

			const getDiscriminatorMatcher = (
				discriminator: Record<string, string>,
			) => {
				return Object.entries(discriminator.mapping)
					.map(([key, value]) => {
						return `with({ ${discriminator.propertyName}: "${key}" }, () => ${camelCase(value?.split("/")?.at(-1) ?? "")}DtoSchema)`;
					})
					.join(".");
			};

			const schemaExpression = isList
				? `z.array(${camelCaseDtoName}Schema)`
				: isDiscriminatedUnion
					? `match(response).${getDiscriminatorMatcher(
							responseBodyInfo?.responses.find((v) => v.isSuccess)?.content?.[
								"application/json"
							]?.schema?.discriminator,
						)}.otherwise(()=>null)`
					: `${camelCaseDtoName}Schema`;

			return {
				...config,
				response: {
					...config.response,
					schema: {
						...config.response.schema,
						expression: isValidType(response.type) ? schemaExpression : null,
					},
				},
			};
		},
	};
}
