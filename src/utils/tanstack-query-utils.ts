import type { ParsedRoute } from '../types/swagger-typescript-api';

export const buildKeyConstantsName = ({ path, method }: Pick<ParsedRoute['request'], 'path' | 'method'>) => {
  return (
    method &&
    path &&
    `${method.toUpperCase()}${path
      .split('/')
      .map((segment) =>
        segment.match(/\$?{/)
          ? segment.replace(/[${}]/g, '').toUpperCase().replace(/_/g, '')
          : segment.toUpperCase().replace(/-/g, '_'),
      )
      .join('_')}`
  );
};
