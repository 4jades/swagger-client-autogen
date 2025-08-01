export type InputCodegenConfig = {
	uri: string;
	username: string;
	password: string;
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
			query?: {
				output: string;
				alias: string;
			};
			mutation?: {
				output: string;
				alias: string;
			};
			schema?: {
				output: string;
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
		pathInfo: DeepTransformPaths<
			Required<NonNullable<InputCodegenConfig["customOutput"]>["pathInfo"]>
		>;
		aliasInfo: NonNullable<
			Required<NonNullable<InputCodegenConfig["customOutput"]>["aliasInfo"]>
		>;
	};
};