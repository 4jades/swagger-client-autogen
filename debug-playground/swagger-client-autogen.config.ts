import { InputCodegenConfig } from "@/index";

export const config: InputCodegenConfig = {
  uri: "swagger/be.yml",
  createSchema: true,
  customOutput: {
    aliasInfo: {
      aliasMap: {
        "@": "src",
      },
      aliasMapDepth: 2,
    },
    pathInfo: {
      api: "output/src/entities/{moduleName}/__generated__/api/index.ts",
      apiInstance: "output/src/entities/{moduleName}/__generated__/api/instance.ts",
      queries: "output/src/entities/{moduleName}/__generated__/api/queries.ts",
      mutations: "output/src/entities/{moduleName}/__generated__/api/mutations.ts",
      dto: "output/src/shared/api/__generated__/dto.ts",
      schema: "output/src/shared/api/__generated__/schema.ts",
      apiUtils: "output/src/shared/api/__generated__/utils.ts",
      typeGuards: "output/src/shared/api/__generated__/type-guards.ts",
      streamUtils: "output/src/shared/api/__generated__/stream-utils.ts",
    }
  }
};