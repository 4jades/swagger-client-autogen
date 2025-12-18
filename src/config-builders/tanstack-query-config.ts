import type { RouteConfig } from '@/types/route-config';
import type { ParsedRoute } from '@/types/swagger-typescript-api';
import { buildKeyConstantsName } from '@/utils/tanstack-query-utils';
import { compact, pascalCase } from 'es-toolkit';
import { produce } from 'immer';
import { pipe } from '../utils/fp';

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
  };
};

export function generateTanstackQueryConfig(route: ParsedRoute, routeConfig: RouteConfig) {
  const configMutators = withRouteConfig(route, routeConfig);
  const pascalCaseRouteName = pascalCase(route.routeName.usage);

  const initialTanstackQueryConfig: TanstackQueryConfig = {
    query: {
      queryKeyArgs: routeConfig.request.parameters.arguments.required.join(', '),
      queryKeyConstanstName: buildKeyConstantsName(route.request) ?? '',
      queryKeyConstanstFunction: '',
      queryHookName: `use${pascalCaseRouteName}Query`,
      suspenseQueryHookName: `use${pascalCaseRouteName}SuspenseQuery`,
    },
    mutation: {
      mutationKeyConstanstName: buildKeyConstantsName(route.request) ?? '',
      mutationKeyConstanstContent: '',
      mutationHookName: `use${pascalCaseRouteName}Mutation`,
    },
  };

  return pipe(
    configMutators.setQueryKeyConstantsFunction,
    configMutators.setMutationKeyConstantsContent,
  )(initialTanstackQueryConfig);
}

function withRouteConfig(route: ParsedRoute, routeConfig: RouteConfig) {
  return {
    setQueryKeyConstantsFunction: (config: TanstackQueryConfig) => {
      const buildQueryKeyArray = (route: ParsedRoute) => {
        const {
          request: { path, method, query, payload },
        } = route;

        if (!path || !method) return null;

        const pathSegments = path
          .split('/')
          .filter(segment => segment && segment !== 'api')
          .map(segment =>
            segment.match(/\${/) ? segment.replace(/[${}]/g, '') : `'${segment}'`,
          );
        const queryParamsSegments = query ? 'params' : null;
        const payloadSegments = payload ? 'payload' : null;

        return `[${[...pathSegments, queryParamsSegments, payloadSegments].filter(Boolean).join(', ')}]`;
      };

      return produce(config, draft => {
        draft.query.queryKeyConstanstFunction = `(${routeConfig.request.parameters.signatures.required.join(', ')})=>${buildQueryKeyArray(route)}`;
      });
    },
    setMutationKeyConstantsContent: (config: TanstackQueryConfig) => {
      const buildMutationKeyConstanstContent = ({ request: { path = '' } }: ParsedRoute) => {
        return `[${compact(path.split('/'))
          .map(segment => `'${segment.replace(/[${}]/g, '')}'`)
          .join(', ')}]`;
      };

      return produce(config, draft => {
        draft.mutation.mutationKeyConstanstContent = buildMutationKeyConstanstContent(route);
      });
    },
  };
}

