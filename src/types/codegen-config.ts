export type InputCodegenConfig = {
  uri: string;
  username?: string;
  password?: string;
  createSchema: boolean;
  customOutput?: {
    aliasInfo: {
      aliasMap: Record<string, string>;
      aliasMapDepth?: number;
    };
    pathInfo?: {
      dto?: string;
      api?: string;
      apiInstance?: string;
      queries?: string;
      mutations?: string;
      schema?: string;
      apiUtils?: string;
      streamUtils?: string;
      typeGuards?: string;
      streamHandlers?: string;
      globalMutationEffectType?: string;
    };
  };
};

type DeepTransformPaths<T> = {
  [K in keyof T]: {
    output: {
      relative: string;
      absolute: string;
    };
  };
};

export type CodegenConfig = Omit<InputCodegenConfig, 'customOutput'> & {
  customOutput: {
    pathInfo: Omit<
      DeepTransformPaths<Required<NonNullable<InputCodegenConfig['customOutput']>['pathInfo']>>,
      'streamHandlers'
    >;
    aliasInfo: NonNullable<Required<NonNullable<InputCodegenConfig['customOutput']>['aliasInfo']>>;
  };
};
