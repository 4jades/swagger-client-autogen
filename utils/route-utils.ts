import { camelCase, compact } from "es-toolkit";
import type { RawRouteInfo } from "../types/swagger-typescript-api";

export const buildRequestFunctionName = (rotue: RawRouteInfo) => {
	const { method, route } = rotue;

  return camelCase(compact([
    method,
    ...route.split("/").map((segment) => {
      return segment.includes("{")
        ? `By_${segment.replace(/[{}]/g, "")}`
        : segment;
    })
  ]).join("_"))
};