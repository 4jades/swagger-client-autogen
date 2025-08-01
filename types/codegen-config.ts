export type InputCodegenConfig = {
	uri: string;
	username: string;
	password: string;
  createSchema: boolean;
	outputMap?: {
    dto?: {
      output: string;
      alias: string;
    },
    api?: {
      output: string;
      alias: string;
    },  
    apiInstance?: {
      output: string;
      alias: string;
    },
    query?: {
      output: string;
      alias: string;
    },
    mutation?: {
      output: string;
      alias: string;
    },
    schema?: {
      output: string;
      alias: string;
    },
  }
};

export type CodegenConfig = Omit<InputCodegenConfig, "outputMap"> & {
  outputMap: Required<InputCodegenConfig["outputMap"]> & {
    dtoGen: {
      output: string;
    }
  }
};