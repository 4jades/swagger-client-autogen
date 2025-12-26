import { compact, pascalCase } from 'es-toolkit';
import { produce } from 'immer';
import type { RouteConfig } from '@/types/route-config';
import type { ParsedRoute } from '@/types/swagger-typescript-api';
import { buildKeyConstantsName } from '@/utils/tanstack-query-utils';
import { pipe } from '../utils/fp';

export type TanstackQueryConfig = {
  query: {
    queryKeyArgs: string;
    queryKeyConstanstName: string;
    queryKeyConstanstFunction: string;
    queryHookName: string;
    suspenseQueryHookName: string;
    staleTime?: number | string;
    staleTimeComment?: string;
    gcTime?: number | string;
    gcTimeComment?: string;
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

  // x- 프로퍼티에서 staleTime과 gcTime 추출
  const rawRoute = route.raw as Record<string, unknown>;
  const xStaleTime = rawRoute['x-staleTime'];
  const xGcTime = rawRoute['x-gcTime'];

  /**
   * 시간 단위를 파싱하여 JS 표현식과 주석을 반환
   * @example
   * parseTimeValue('5m') => { expression: '5 * 60 * 1000', comment: '5분' }
   * parseTimeValue('1h30m') => { expression: '1 * 60 * 60 * 1000 + 30 * 60 * 1000', comment: '1시간 30분' }
   * parseTimeValue('Infinity') => { expression: 'Infinity', comment: undefined }
   * parseTimeValue('static') => { expression: "'static'", comment: undefined }
   */
  const parseTimeValue = (
    value: unknown,
  ): { expression: string | number; comment?: string } | undefined => {
    // 숫자는 그대로 반환
    if (typeof value === 'number') {
      return { expression: value };
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    // Infinity는 특별 처리
    if (value === 'Infinity') {
      return { expression: 'Infinity' };
    }

    // static은 특별 처리 (staleTime 전용)
    if (value === 'static') {
      return { expression: "'static'" };
    }

    // 시간 단위 파싱: '5h', '30m', '45s', '1h30m', '1h30m45s' 등
    const regex = /(\d+)(h|m|s)/g;
    const matches = [...value.matchAll(regex)];

    if (matches.length === 0) {
      return undefined;
    }

    const multipliers = {
      h: { ms: 60 * 60 * 1000, label: '시간' },
      m: { ms: 60 * 1000, label: '분' },
      s: { ms: 1000, label: '초' },
    };

    // 표현식 생성
    const expressions = matches.map(([, num, unit]) => {
      if (unit === 'h') return `${num} * 60 * 60 * 1000`;
      if (unit === 'm') return `${num} * 60 * 1000`;
      return `${num} * 1000`;
    });

    // 주석 생성
    const commentParts = matches.map(([, num, unit]) => {
      const { label } = multipliers[unit as 'h' | 'm' | 's'];
      return `${num}${label}`;
    });

    return {
      expression: expressions.join(' + '),
      comment: commentParts.join(' '),
    };
  };

  const queryOptions: TanstackQueryConfig['query'] = {
    queryKeyArgs: routeConfig.request.parameters.arguments.required.join(', '),
    queryKeyConstanstName: buildKeyConstantsName(route.request) ?? '',
    queryKeyConstanstFunction: '',
    queryHookName: `use${pascalCaseRouteName}Query`,
    suspenseQueryHookName: `use${pascalCaseRouteName}SuspenseQuery`,
  };

  // staleTime과 gcTime 파싱 및 추가
  const parsedStaleTime = parseTimeValue(xStaleTime);
  const parsedGcTime = parseTimeValue(xGcTime);

  if (parsedStaleTime) {
    queryOptions.staleTime = parsedStaleTime.expression;
    if (parsedStaleTime.comment) {
      queryOptions.staleTimeComment = parsedStaleTime.comment;
    }
  }
  if (parsedGcTime) {
    queryOptions.gcTime = parsedGcTime.expression;
    if (parsedGcTime.comment) {
      queryOptions.gcTimeComment = parsedGcTime.comment;
    }
  }

  const initialTanstackQueryConfig: TanstackQueryConfig = {
    query: queryOptions,
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
          .filter((segment) => segment && segment !== 'api')
          .map((segment) => (segment.match(/\${/) ? segment.replace(/[${}]/g, '') : `'${segment}'`));
        const queryParamsSegments = query ? 'params' : null;
        const payloadSegments = payload ? 'payload' : null;

        return `[${[...pathSegments, queryParamsSegments, payloadSegments].filter(Boolean).join(', ')}]`;
      };

      return produce(config, (draft) => {
        draft.query.queryKeyConstanstFunction = `(${routeConfig.request.parameters.signatures.required.join(', ')})=>${buildQueryKeyArray(route)}`;
      });
    },
    setMutationKeyConstantsContent: (config: TanstackQueryConfig) => {
      const buildMutationKeyConstanstContent = ({ request: { path = '' } }: ParsedRoute) => {
        return `[${compact(path.split('/'))
          .map((segment) => `'${segment.replace(/[${}]/g, '')}'`)
          .join(', ')}]`;
      };

      return produce(config, (draft) => {
        draft.mutation.mutationKeyConstanstContent = buildMutationKeyConstanstContent(route);
      });
    },
  };
}
