import { compact } from "es-toolkit";
import type { ParsedRoute } from "../types/swagger-typescript-api";
import type { generateConfig } from "./route-config";

export const buildQueryKeyConstantsName = ({
	request: { path, method },
}: ParsedRoute) =>
	method &&
	path &&
	`${method.toUpperCase()}_${path
		.split("/")
		.filter((segment) => segment && segment !== "api")
		.map((segment) =>
			segment.match(/\${/)
				? segment.replace(/[${}]/g, "").toUpperCase().replace(/-/g, "_")
				: segment.toUpperCase().replace(/-/g, "_"),
		)
		.join("_")}`;

export const buildQueryKeyArray = (route: ParsedRoute) => {
	const {
		request: { path, method, query, payload },
	} = route;

	if (!path || !method) return null;

	const pathSegments = path
		.split("/")
		.filter((segment) => segment && segment !== "api")
		.map((segment) =>
			segment.match(/\${/)
				? segment.replace(/[${}]/g, "").replace(/-/g, "_")
				: `'${segment.replace(/-/g, "_")}'`,
		);
	const queryParamsSegments = query ? "params" : null;
	const payloadSegments = payload ? "payload" : null;

	return `[${[...pathSegments, queryParamsSegments, payloadSegments]
		.filter(Boolean)
		.join(", ")}]`;
};

export const buildMutationKeyConstantsName = (route: ParsedRoute) => {
	return buildQueryKeyConstantsName(route);
};

export const buildMutationKeyConstanstContent = ({
	request: { path = "" },
}: ParsedRoute) => {
	return `[${compact(path.split("/"))
		.map((segment) => `'${segment.replace(/[${}]/g, "")}'`)
		.join(", ")}]`;
};

export const buildQueryKeyInlineRequestParameter = (
	config: ReturnType<typeof generateConfig>,
) => {
	return config.request.parameters.signatures.required.join(", ");
};

export const buildQueryKeyArgs = (
	config: ReturnType<typeof generateConfig>,
) => {
	return config.request.parameters.arguments.required.join(", ");
};
