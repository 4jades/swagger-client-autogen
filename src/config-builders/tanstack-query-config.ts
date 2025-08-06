import type { RouteConfig } from '@/types/route-config';
import type { ParsedRoute } from '@/types/swagger-typescript-api';
import { camelCase, compact, findKey, pascalCase } from 'es-toolkit';
import { produce } from 'immer';
import { P, match } from 'ts-pattern';
import { pipe } from '../utils/fp';
import { log } from '../utils/log';

export type TanstackQueryConfig = {
  query: {
    queryKeyArgs: string;
    queryKeyConstanstName: string;
    queryKeyConstanstFunction: string;
    queryHookName: string;
    suspenseQueryHookName: string;
    staleTime: number | null | string;
    gcTime: number | null | string;
  };
  mutation: {
    mutationKeyConstanstName: string;
    mutationKeyConstanstContent: string;
    mutationHookName: string;
    invalidateQueryKey: string[];
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
      staleTime: null,
      gcTime: null,
    },
    mutation: {
      mutationKeyConstanstName: buildKeyConstantsName(route.request) ?? '',
      mutationKeyConstanstContent: '',
      mutationHookName: `use${pascalCaseRouteName}Mutation`,
      invalidateQueryKey: [],
    },
  };

  return pipe(
    configMutators.setQueryKeyConstantsFunction,
    configMutators.setStaleTime,
    configMutators.setGcTime,
    configMutators.setMutationKeyConstantsContent,
    configMutators.setInvalidateQueryKey,
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
            segment.match(/\${/) ? segment.replace(/[${}]/g, '').replace(/-/g, '_') : `'${segment.replace(/-/g, '_')}'`,
          );
        const queryParamsSegments = query ? 'params' : null;
        const payloadSegments = payload ? 'payload' : null;

        return `[${[...pathSegments, queryParamsSegments, payloadSegments].filter(Boolean).join(', ')}]`;
      };

      return produce(config, draft => {
        draft.query.queryKeyConstanstFunction = `(${routeConfig.request.parameters.signatures.required.join(', ')})=>${buildQueryKeyArray(route)}`;
      });
    },
    setStaleTime: (config: TanstackQueryConfig) => {
      const { raw } = route;

      if (!('x-stale-time' in raw)) {
        return config;
      }

      const xStaleTime = raw['x-stale-time'] === 'infinity' ? 'Number.POSITIVE_INFINITY' : Number(raw['x-stale-time']);

      return produce(config, draft => {
        draft.query.staleTime = xStaleTime;
      });
    },
    setGcTime: (config: TanstackQueryConfig) => {
      const { raw } = route;

      if (!('x-gc-time' in raw)) {
        return config;
      }

      const xGcTime = raw['x-gc-time'] === 'infinity' ? 'Number.POSITIVE_INFINITY' : Number(raw['x-gc-time']);

      return produce(config, draft => {
        draft.query.gcTime = xGcTime;
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
    setInvalidateQueryKey: (config: TanstackQueryConfig) => {
      const { raw } = route;

      // 새로운 형태의 x-query-key 파싱: GET_CHATS_CHATID_PROBLEMS($parameters.chat_id)
      const parseQueryKeyFunction = (queryKey: string) => {
        const match = queryKey.match(/^([A-Z_]+)\(([^)]*)\)$/);
        if (!match) {
          log.warn(
            `Invalid query key format: ${queryKey}. Expected format: GET_CHATS_CHATID_PROBLEMS($parameters.chat_id)`,
          );
          return null;
        }

        const [, functionName, argsString] = match;
        const args = argsString ? argsString.split(',').map(arg => arg.trim()) : [];

        return { functionName, args };
      };

      const resolveArgument = (arg: string) => {
        return match(arg.trim())
          .with('$parameters.$query', () => 'params')
          .with(P.string.startsWith('$parameters.'), p => `variables.${camelCase(p.split('.').at(-1) ?? '')}`)
          .with(P.string.startsWith('$payload.'), p => `data.${camelCase(p.split('.').at(-1) ?? '')}`)
          .with(P.string.startsWith('$response.'), p => `data.${camelCase(p.split('.').at(-1) ?? '')}`)
          .otherwise(() => null);
      };

      const findRequestByQueryKey = (route: ParsedRoute, queryKey: string) => {
        const paths = route.specificArgNameResolver?.config.swaggerSchema.paths ?? {};

        const path = findKey(paths, path => path.get?.['x-query-key'] === queryKey);

        if (!path) {
          log.warn(`${queryKey}와 일치하는 x-query-key가 존재하지 않습니다.`);
          return null;
        }

        return { path: String(path), method: 'get' };
      };

      if (!('x-invalidate-query-key' in raw) || !Array.isArray(raw['x-invalidate-query-key'])) {
        return config;
      }

      const xInvalidateQueryKeys = raw['x-invalidate-query-key'];

      const invalidateQueryKeyCallExpression = xInvalidateQueryKeys.map(key => {
        // 새로운 형태 파싱
        const parsed = parseQueryKeyFunction(key);
        if (!parsed) {
          return null;
        }

        const { functionName, args } = parsed;

        // 함수 이름으로 해당 request 찾기
        const request = findRequestByQueryKey(route, key);
        if (!request) {
          return null;
        }

        // 인수들을 실제 변수로 변환
        const resolvedArgs = args.map(resolveArgument).filter(Boolean);

        // 함수명은 그대로 사용 (이미 올바른 형태)
        return `${functionName}(${resolvedArgs.join(', ')})`;
      });

      return produce(config, draft => {
        draft.mutation.invalidateQueryKey = compact(invalidateQueryKeyCallExpression);
      });
    },
  };
}

function buildKeyConstantsName({ path, method }: Pick<ParsedRoute['request'], 'path' | 'method'>) {
  return (
    method &&
    path &&
    `${method.toUpperCase()}${path
      .split('/')
      .map(segment =>
        segment.match(/\$?{/)
          ? segment.replace(/[${}]/g, '').toUpperCase().replace(/_/g, '')
          : segment.toUpperCase().replace(/-/g, '_'),
      )
      .join('_')}`
  );
}