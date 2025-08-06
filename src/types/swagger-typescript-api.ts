import type { generateApi } from "swagger-typescript-api";

export type ParsedRoute = Parameters<
	NonNullable<
		NonNullable<Parameters<typeof generateApi>[0]["hooks"]>["onCreateRoute"]
	>
>[0];

export type RawRouteInfo = Parameters<
	NonNullable<
		NonNullable<Parameters<typeof generateApi>[0]["hooks"]>["onCreateRouteName"]
	>
>[1];