import fs from 'node:fs';
import path from 'node:path';
import { kebabCase } from 'es-toolkit';
import yaml from 'js-yaml';
import minimist from 'minimist';
import { fetchSwagger } from '../utils/fetch-swagger';
import { writeFileToPath } from '../utils/file';
import { log } from '../utils/log';
import { isUrl } from '../utils/url';

function extractQueryKey(pathKey, tags, parameters) {
  const pathSegments = pathKey.split('/').filter(Boolean);
  const baseKey = tags?.[0] ?? 'data';
  const queryKeyParts = [baseKey];

  for (const segment of pathSegments) {
    if (segment.startsWith('{') && segment.endsWith('}')) {
      queryKeyParts.push(`$parameters.${segment.slice(1, -1)}`);
    } else if (segment !== baseKey) {
      queryKeyParts.push(segment);
    }
  }

  if (parameters?.some(p => p.in === 'query')) {
    queryKeyParts.push('$parameters.$query');
  }

  // 배열을 문자열로 변환
  return `[${queryKeyParts.join(', ')}]`;
}

function injectQueryKey(operation, queryKey) {
  return {
    ...operation,
    'x-query-key': queryKey,
  };
}

export function addQueryKeyToGetRequests(swaggerData) {
  if (!swaggerData.paths) return swaggerData;

  for (const [pathKey, pathItem] of Object.entries(swaggerData.paths)) {
    const getOp = pathItem.get;
    if (!getOp || getOp['x-query-key']) continue;

    const queryKey = extractQueryKey(pathKey, getOp.tags, getOp.parameters);
    pathItem.get = injectQueryKey(getOp, queryKey);

    log.success(`${pathKey} → x-query-key: ${queryKey}`);
  }

  return swaggerData;
}

// operationId를 기준으로 operation들을 매핑하는 함수
function mapOperationsByOperationId(swaggerData) {
  const operationMap = new Map();

  if (!swaggerData.paths) return operationMap;

  for (const [pathKey, pathItem] of Object.entries(swaggerData.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (typeof operation === 'object' && operation.operationId) {
        operationMap.set(operation.operationId, {
          pathKey,
          method,
          operation,
        });
      }
    }
  }

  return operationMap;
}

// 커스텀 필드(x-로 시작)를 병합하는 함수
function mergeCustomFields(newOperation, existingOperation) {
  const mergedOperation = { ...newOperation };

  // 기존 operation에서 x-로 시작하는 필드들을 찾아서 병합
  for (const [key, value] of Object.entries(existingOperation)) {
    if (key.startsWith('x-')) {
      // x-query-key는 새로운 것을 우선시 (이미 새로운 operation에 있음)
      if (key === 'x-query-key') {
        // 변경 감지 (이제 문자열 비교)
        const existingQueryKey = existingOperation[key];
        const newQueryKey = newOperation[key];

        if (existingQueryKey !== newQueryKey) {
          console.group();
          log.warn(`Query key changed for ${existingOperation.operationId || 'unknown operation'}:`);
          log.log(`  Old: ${existingQueryKey}`);
          log.log(`  New: ${newQueryKey}`);
          console.groupEnd();
        }
        continue;
      }

      // 다른 x-필드들은 기존 것을 우선시
      mergedOperation[key] = value;
    }
  }

  return mergedOperation;
}

// Swagger 문서를 병합하는 함수
function mergeSwaggerData(newSwaggerData, existingSwaggerData) {
  const newOperationMap = mapOperationsByOperationId(newSwaggerData);
  const existingOperationMap = mapOperationsByOperationId(existingSwaggerData);

  // 새로운 swagger를 기반으로 시작
  const mergedSwaggerData = JSON.parse(JSON.stringify(newSwaggerData));

  // operationId가 일치하는 operation들을 병합
  for (const [operationId, existingOpInfo] of existingOperationMap) {
    const newOpInfo = newOperationMap.get(operationId);

    if (newOpInfo) {
      // 같은 operationId를 가진 operation이 있으면 커스텀 필드 병합
      const mergedOperation = mergeCustomFields(newOpInfo.operation, existingOpInfo.operation);

      // 병합된 operation을 새로운 swagger 데이터에 적용
      mergedSwaggerData.paths[newOpInfo.pathKey][newOpInfo.method] = mergedOperation;

      log.info(`Merged custom fields for ${operationId}`);
    } else {
      // 새로운 swagger에는 없지만 기존에 있던 operation
      log.warn(`Operation ${operationId} exists in local file but not in server response`);
    }
  }

  return mergedSwaggerData;
}

const argv = minimist(process.argv.slice(2), {
  string: ['config', 'output'],
  alias: {
    c: 'config',
    o: 'output',
  },
});

const { config: configPath, output } = argv;

if (!configPath) {
  console.error('❗️ 오류: Config 파일 경로를 제공해주세요');
  console.error('사용법: node fetch-swagger.js --config <config-file-path> [--output <output-path>]');
  process.exit(1);
}

// Config 파일 로드
const loadConfig = async configPath => {
  try {
    const absoluteConfigPath = path.resolve(process.cwd(), configPath);
    const { default: config } = await import(`file://${absoluteConfigPath}`);
    return config;
  } catch (error) {
    log.error(`Config 파일을 로드할 수 없습니다: ${configPath}`, error);
    process.exit(1);
  }
};

const config = await loadConfig(configPath);

if (!config.uri) {
  console.error('❗️ 오류: Config 파일에 uri(Swagger URI)가 정의되지 않았습니다');
  process.exit(1);
}

if (!isUrl(config.uri)) {
  // URI가 웹 주소인지 확인
  console.error('❗️ 오류: fetch 명령어는 웹 URL만 지원합니다. 로컬 파일은 지원하지 않습니다.');
  console.error(`제공된 URI: ${config.uri}`);
  process.exit(1);
}

try {
  const swaggerData = await fetchSwagger(config.uri, config.username, config.password);

  // GET 요청에 x-query-key 추가
  const modifiedSwaggerData = addQueryKeyToGetRequests(swaggerData);

  // 출력 경로 결정
  const targetFilePath = output
    ? path.resolve(process.cwd(), output)
    : path.resolve(process.cwd(), `swagger/${kebabCase(modifiedSwaggerData.info.title)}.yml`);

  // 기존 파일이 있는지 확인하고 병합
  let finalSwaggerData = modifiedSwaggerData;

  if (fs.existsSync(targetFilePath)) {
    try {
      const existingYamlContent = fs.readFileSync(targetFilePath, 'utf8');
      const existingSwaggerData = yaml.load(existingYamlContent);

      log.info('Found existing swagger file, merging...');
      finalSwaggerData = mergeSwaggerData(modifiedSwaggerData, existingSwaggerData);
      log.success('Merge completed');
    } catch (mergeError) {
      log.warn('Failed to merge with existing file, using new data only:', mergeError.message);
      finalSwaggerData = modifiedSwaggerData;
    }
  }

  const yamlData = yaml.dump(finalSwaggerData);

  await writeFileToPath(targetFilePath, yamlData);

  log.success('Successfully imported and converted swagger file to YAML.');
} catch (e) {
  log.error('Failed to import and convert swagger file.', e);
}
