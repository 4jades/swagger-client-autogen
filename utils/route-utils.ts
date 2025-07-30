import { camelCase, compact } from "es-toolkit";
import type { RawRouteInfo } from "../types/swagger-typescript-api";

export const buildRequestFunctionName = (rotue: RawRouteInfo) => {
	const { method, route } = rotue;

	return camelCase(
		compact([
			method,
			...route.split("/").map((segment) => {
				return segment.includes("{")
					? `By_${segment.replace(/[{}]/g, "")}`
					: segment;
			}),
		]).join("_"),
	);
};

export const isValidType = (type) => {
	const invalidTypes = ["void", "any", "null", "undefined", "object", "string"];
	const invalidPattern = new RegExp(invalidTypes.join("|"), "i");
	return type && !invalidPattern.test(type);
};

export const getDiscriminatorMatcher = (
	discriminator: Record<string, string>,
) => {
	return Object.entries(discriminator.mapping)
		.map(([key, value]) => {
			return `with({ ${discriminator.propertyName}: "${key}" }, () => ${camelCase(value?.split("/")?.at(-1) ?? "")}DtoSchema)`;
		})
		.join(".");
};