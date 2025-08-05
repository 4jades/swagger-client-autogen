export type InputCodegenConfig = {
  uri: string;
  username?: string;
  password?: string;
  createSchema: boolean;
  customOutput?: {
    aliasInfo?: {
      aliasMap?: Record<string, string>;
      aliasMapDepth?: number;
    };
    pathInfo?: {
      dto?: {
        output: string;
        alias: string;
      };
      api?: {
        output: string;
        alias: string;
      };
      apiInstance?: {
        output: string;
        alias: string;
      };
      queries?: {
        output: string;
        alias: string;
      };
      mutations?: {
        output: string;
        alias: string;
      };
      schema?: {
        output: string;
        alias: string;
      };
      apiUtils?: {
        output: string;
        alias: string;
      };
      streamUtils?: {
        output: string;
        alias: string;
      };
      typeGuards?: {
        output: string;
        alias: string;
      };
      streamHandlers?: {
        alias: string;
      };
    };
  };
};

type DeepTransformPaths<T> = {
	[K in keyof T]: {
		output: {
			relative: string;
			absolute: string;
		};
		alias: string;
	};
};

export type CodegenConfig = Omit<InputCodegenConfig, "customOutput"> & {
		customOutput: {
			pathInfo: Omit<
				DeepTransformPaths<
					Required<NonNullable<InputCodegenConfig["customOutput"]>["pathInfo"]>
				>,
				"streamHandlers"
			>;
			aliasInfo: NonNullable<
				Required<NonNullable<InputCodegenConfig["customOutput"]>["aliasInfo"]>
			>;
		};
	};