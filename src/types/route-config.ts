export type RouteConfig = {
  request: {
    functionName: string;
    pathParams: {
      signatures: string[];
      arguments: string[];
    };
    query: {
      dtoName: string | null;
      schema: {
        name: string;
      };
    };
    headers: {
      dtoName: string | null;
      schema: {
        name: string;
      };
    };
    payload: {
      dtoName: string | null;
    };
    options: {
      typeExpr: string | null;
    };
    parameters: {
      signatures: {
        required: string[];
        all: string[];
      };
      arguments: {
        required: string[];
        all: string[];
      };
    };
    schema: {
      list: string[];
      expression: string | null;
    };
  };
  response: {
    dtoName: string | null;
    schema: {
      list: string[];
      expression: string | null;
    };
  };
};
