import { camelCase, compact, findKey, pascalCase } from 'es-toolkit';
import { P, match } from 'ts-pattern';
import type { RouteConfig } from 'types/route-config';
import type { ParsedRoute } from 'types/swagger-typescript-api';
import { pipe } from '../utils/fp';
import { buildMutationKeyConstanstContent, buildMutationKeyConstantsName, buildQueryKeyArgs, buildQueryKeyArray, buildQueryKeyConstantsName } from '../utils/tanstack-query-utils';

export type TanstackQueryConfig = {
  query: {
    queryKeyArgs: string;
    queryKeyConstanstName: string;
    queryKeyConstanstFunction: string;
    queryHookName: string;
    suspenseQueryHookName: string;
  };
  mutation: {
    mutationKeyConstanstName: string;
    mutationKeyConstanstContent: string;
    mutationHookName: string;
    invalidateQueryKey: string[];
  };
};

export function generateTanstackQueryConfig(route: ParsedRoute, routeConfig: RouteConfig) {
  const configMutators = withRouteConfig(route, routeConfig)
  const pascalCaseRouteName = pascalCase(route.routeName.usage);

  const initialTanstackQueryConfig: TanstackQueryConfig = {
    query: {
      queryKeyArgs: buildQueryKeyArgs(routeConfig),
      queryKeyConstanstName: buildQueryKeyConstantsName(route.request) ?? '',
      queryKeyConstanstFunction: `(${routeConfig.request.parameters.signatures.required.join(', ')})=>${buildQueryKeyArray(route)}`,
      queryHookName: `use${pascalCaseRouteName}Query`,
      suspenseQueryHookName: `use${pascalCaseRouteName}SuspenseQuery`,
    },
    mutation: {
      mutationKeyConstanstName: buildMutationKeyConstantsName(route) ?? '',
      mutationKeyConstanstContent: buildMutationKeyConstanstContent(route),
      mutationHookName: `use${pascalCaseRouteName}Mutation`,
      invalidateQueryKey: [],
    },
  };

  return pipe(
    configMutators.setInvalidateQueryKey,
  )(initialTanstackQueryConfig);
};

function findRequestByQueryKey(route: ParsedRoute, queryKey: string) {
  const paths = route.specificArgNameResolver?.config.swaggerSchema.paths ?? {}

  const path = findKey(paths, (path) => path.get?.['x-query-key'] === queryKey)

  if (!path) {
    return null
  }

  return {path: String(path), method: 'get'}
}

function withRouteConfig(route: ParsedRoute, _routeConfig: RouteConfig) {
  const getQueryKeyArgs = (queryKey: string) => {
    return queryKey.slice(1,-1).split(', ')
      .map(arg => 
        match(arg.trim())
          .with(
            '$parameters.$query',
            () => 'params',
          )
          .with(
            P.string.startsWith('$parameters.'),
            (p) => `variables.${camelCase(p.split('.').at(-1) ?? '')}`,
          )
          .with(
            P.string.startsWith('$payload.'),
            (p) => `data.${camelCase(p.split('.').at(-1) ?? '')}`,
          )
          .otherwise(() => null))
      .filter(Boolean)
  }

  return {
    setInvalidateQueryKey: (config: TanstackQueryConfig) => {
      const {raw} = route
      
      if (!('x-invalidate-query-key' in raw) || !Array.isArray(raw['x-invalidate-query-key'])) {
        return config
      }

      const xInvalidateQueryKeys = raw['x-invalidate-query-key']

      const invalidateQueryKeyCallExpression = xInvalidateQueryKeys.map(key => {
        const request = findRequestByQueryKey(route, key)

        if (!request) {
          return null
        }

        const {path, method} = request

        const newArgs = getQueryKeyArgs(key)

        return `${buildQueryKeyConstantsName({path, method})}(${newArgs.join(', ')})`
      })

      return {
        ...config,
        mutation: {
          ...config.mutation,
          invalidateQueryKey: compact(invalidateQueryKeyCallExpression),
        },
      }
    }
  };
}