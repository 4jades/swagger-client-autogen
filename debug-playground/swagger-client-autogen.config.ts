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
  }
};