import { camelCase, compact, pascalCase } from 'es-toolkit';
import { produce } from 'immer';
import type { RouteConfig } from '../types/route-config';
import type { ParsedRoute } from '../types/swagger-typescript-api';
import { pipe } from '../utils/fp';
import { getDiscriminatorMatcher, isValidType } from '../utils/route-utils';

export function generateConfig(route: ParsedRoute) {
  const configMutators = withRoute(route);
  const initialRouteConfig: RouteConfig = {
    request: {
      functionName: route.routeName.usage,
      pathParams: {
        signatures: new Array<string>(),
        arguments: new Array<string>(),
      },
      query: {
        dtoName: '',
        schema: {
          name: '',
        },
      },
      headers: {
        dtoName: '',
        schema: {
          name: '',
        },
      },
      payload: {
        dtoName: '',
      },
      options: {
        typeExpr: '',
      },
      parameters: {
        signatures: {
          required: new Array<string>(),
          all: new Array<string>(),
        },
        arguments: {
          required: new Array<string>(),
          all: new Array<string>(),
        },
      },
      schema: {
        list: new Array<string>(),
        expression: null,
      },
    },
    response: {
      dtoName: '',
      schema: {
        list: new Array<string>(),
        expression: null,
      },
    },
  };

  return pipe(
    configMutators.setRequestFunctionName,
    configMutators.setPathParamsSignatures,
    configMutators.setPathParamsArguments,
    configMutators.setQueryInfo,
    configMutators.setHeaderInfo,
    configMutators.setPayloadDtoName,
    configMutators.setRequestFunctionOptionsTypeExpression,
    configMutators.setRequestRequiredSignatures,
    configMutators.setRequestAllSignatures,
    configMutators.setRequestRequiredArguments,
    configMutators.setRequestAllArguments,
    configMutators.setResponseDtoName,
    configMutators.setRequestSchema,
    configMutators.setResponseSchema,
  )(initialRouteConfig);
}

function withRoute(route: ParsedRoute) {
  return {
    setRequestFunctionName: (config: RouteConfig): RouteConfig => {
      return produce(config, draft => {
        draft.request.functionName = route.routeName.usage;
      });
    },
    setPathParamsSignatures: (config: RouteConfig): RouteConfig => {
      const { parameters } = route.request;

      return produce(config, draft => {
        draft.request.pathParams.signatures =
          parameters?.map(parameter => {
            return compact([parameter.name, parameter.optional && '?', ':', parameter.type]).join('');
          }) ?? [];
      });
    },
    setPathParamsArguments: (config: RouteConfig): RouteConfig => {
      const { parameters } = route.request;

      return produce(config, draft => {
        draft.request.pathParams.arguments =
          parameters?.map(parameter => {
            return parameter.name as unknown as string;
          }) ?? [];
      });
    },
    setQueryInfo: (config: RouteConfig): RouteConfig => {
      const { request, routeName } = route;

      return produce(config, draft => {
        draft.request.query.dtoName = request.query ? pascalCase(`${routeName.original}QueryParams`) : null;
        draft.request.query.schema.name = request.query ? `${routeName.original}QueryParamsSchema` : '';
      });
    },
    setHeaderInfo: (config: RouteConfig): RouteConfig => {
      const { request, routeName } = route;

      return produce(config, draft => {
        draft.request.headers.dtoName = request.headers ? pascalCase(`${routeName.original}Headers`) : null;
        draft.request.headers.schema.name = request.headers ? `${routeName.original}HeadersSchema` : '';
      });
    },
    setPayloadDtoName: (config: RouteConfig): RouteConfig => {
      return produce(config, draft => {
        draft.request.payload.dtoName = route.specificArgs?.body?.type;
      });
    },
    setRequestFunctionOptionsTypeExpression: (config: RouteConfig): RouteConfig => {
      const { request } = route;

      return produce(config, draft => {
        draft.request.options.typeExpr = request.headers
          ? `Omit<Options, 'headers'> & { headers: ${config.request.headers.dtoName} }`
          : 'Options';
      });
    },
    setRequestRequiredSignatures: (config: RouteConfig): RouteConfig => {
      const inlineQueryParamsParameter =
        route.request.query &&
        compact(['params', route.request.query.optional && '?', ': ', config.request.query.dtoName]).join('');

      const inlinePayloadParameter =
        route.request.payload &&
        compact(['payload', route.request.payload.optional && '?', ': ', config.request.payload.dtoName]).join('');

      return produce(config, draft => {
        draft.request.parameters.signatures.required = compact([
          ...config.request.pathParams.signatures,
          inlineQueryParamsParameter,
          inlinePayloadParameter,
        ]);
      });
    },
    setRequestAllSignatures: (config: RouteConfig): RouteConfig => {
      return produce(config, draft => {
        draft.request.parameters.signatures.all = compact([
          ...config.request.parameters.signatures.required,
          'kyInstance?: KyInstance',
          `options?: ${config.request.options.typeExpr}`,
        ]);
      });
    },
    setRequestRequiredArguments: (config: RouteConfig): RouteConfig => {
      const inlineQueryParamsArgs = route.request.query && 'params';
      const inlinePayloadArgs = route.request.payload && 'payload';

      return produce(config, draft => {
        draft.request.parameters.arguments.required = compact([
          ...config.request.pathParams.arguments,
          inlineQueryParamsArgs,
          inlinePayloadArgs,
        ]);
      });
    },
    setRequestAllArguments: (config: RouteConfig): RouteConfig => {
      return produce(config, draft => {
        draft.request.parameters.arguments.all = compact([
          ...config.request.parameters.arguments.required,
          'kyInstance',
          'options',
        ]);
      });
    },
    setResponseDtoName: (config: RouteConfig): RouteConfig => {
      return produce(config, draft => {
        draft.response.dtoName = route.response.type ?? null;
      });
    },
    setRequestSchema: (config: RouteConfig): RouteConfig => {
      const { requestBodyInfo } = route;
      const nomalSchemaName = `${camelCase(config.request.payload.dtoName ?? '')}Schema`;

      const isList = Boolean(requestBodyInfo?.schema?.type === 'array');
      const isDiscriminatedUnion = Boolean(requestBodyInfo?.schema?.discriminator);
      const discriminator =
        //@ts-expect-error
        requestBodyInfo?.content?.['application/json']?.schema?.discriminator;

      const schemaExpression = isList
        ? `z.array(${nomalSchemaName})`
        : isDiscriminatedUnion
          ? `match(payload).${getDiscriminatorMatcher(discriminator)}.otherwise(()=>null)`
          : nomalSchemaName;

      return produce(config, draft => {
        draft.request.schema.list = isDiscriminatedUnion
          ? Object.values(discriminator.mapping).map(
              v => `${camelCase((v as string).split('/').at(-1) ?? '')}DtoSchema`,
            )
          : [nomalSchemaName];
        draft.request.schema.expression = isValidType(config.request.payload.dtoName) ? schemaExpression : null;
      });
    },
    setResponseSchema: (config: RouteConfig): RouteConfig => {
      const { responseBodyInfo, response } = route;
      const nomalSchemaName = `${camelCase(config.response.dtoName ?? '')}Schema`;

      const isList = Boolean(
        responseBodyInfo?.responses.find(v => v.isSuccess)?.content?.['application/json']?.schema?.type === 'array',
      );
      const isDiscriminatedUnion = Boolean(
        responseBodyInfo?.responses.find(v => v.isSuccess)?.content?.['application/json']?.schema?.discriminator,
      );
      const discriminator = responseBodyInfo?.responses.find(v => v.isSuccess)?.content?.['application/json']?.schema
        ?.discriminator;

      const schemaExpression = isList
        ? `z.array(${nomalSchemaName})`
        : isDiscriminatedUnion
          ? `match(response).${getDiscriminatorMatcher(discriminator)}.otherwise(()=>null)`
          : nomalSchemaName;

      return produce(config, draft => {
        draft.response.schema.list = isDiscriminatedUnion
          ? Object.values(discriminator.mapping).map(
              v => `${camelCase((v as string).split('/').at(-1) ?? '')}DtoSchema`,
            )
          : [nomalSchemaName];
        draft.response.schema.expression = isValidType(response.type) ? schemaExpression : null;
      });
    },
  };
}
