
import path from "node:path";
import { generateApi } from "swagger-typescript-api";
import { fetchSwagger } from './fetch-swagger';
import { AnyOfSchemaParser } from './parser';
import { isUrl } from './url';

type GenerateApiCodeParams = Omit<
	Parameters<typeof generateApi>[0],
	"input" | "spec" | "moduleNameFirstTag" | "generateRouteTypes"
> & {
	uri: string;
	username: string;
	password: string;
	templates: string;
};

export const generateApiCode = async ({
  uri,
  username,
  password,
  templates,
  ...params
}: GenerateApiCodeParams): Promise<Awaited<ReturnType<typeof generateApi>>> => {
  const isLocal = !isUrl(uri);

  return generateApi({
    input: isLocal ? path.resolve(process.cwd(), uri) : undefined,
    spec: !isLocal && (await fetchSwagger(uri, username, password)),
    //@ts-expect-error: templates, modular 옵션은 cli 옵션이라서 타입에 없음
    templates,
    modular: true,

    generateClient: true,
    generateUnionEnums: true,
    cleanOutput: false,
    silent: true,
    moduleNameFirstTag: true,
    typeSuffix: 'Dto',
    generateRouteTypes: true,
    schemaParsers: {
      complexAnyOf: AnyOfSchemaParser,
    },
    ...params,
  });
};