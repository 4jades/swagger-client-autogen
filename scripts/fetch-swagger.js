#!/usr/bin/env -S npx tsx

import fs from 'node:fs';
import path from 'node:path';
import { kebabCase } from 'es-toolkit';
import yaml from 'js-yaml';
import minimist from 'minimist';
import { fetchSwagger } from '../utils/fetch-swagger';
import { writeFileToPath } from '../utils/file';

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

    console.log(`✅ ${pathKey} → x-query-key: ${queryKey}`);
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
          console.warn(`⚠️ Query key changed for ${existingOperation.operationId || 'unknown operation'}:`);
          console.warn(`  Old: ${existingQueryKey}`);
          console.warn(`  New: ${newQueryKey}`);
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

      console.log(`🔄 Merged custom fields for ${operationId}`);
    } else {
      // 새로운 swagger에는 없지만 기존에 있던 operation
      console.log(`⚠️  Operation ${operationId} exists in local file but not in server response`);
    }
  }

  return mergedSwaggerData;
}

const argv = minimist(process.argv.slice(2), {
  string: ['url'],
  alias: {
    u: 'url',
    un: 'username',
    pw: 'password',
  },
});

const { url } = argv;

const usernameArg = argv.username;
const passwordArg = argv.password;

if (!url) {
  console.error('❗️ 오류: Swagger URL 또는 Swagger 파일 이름을 제공해주세요');
  console.error(
    '사용법: node fetch-swagger.js --uri <swagger-url|swagger-file-name> ' +
      '[--username <username>] [--password <password>] ',
  );
  process.exit(1);
}

try {
  const swaggerData = await fetchSwagger(url, usernameArg, passwordArg);

  // GET 요청에 x-query-key 추가
  const modifiedSwaggerData = addQueryKeyToGetRequests(swaggerData);

  const targetFilePath = path.resolve(process.cwd(), `swagger/${kebabCase(modifiedSwaggerData.info.title)}.yml`);

  // 기존 파일이 있는지 확인하고 병합
  let finalSwaggerData = modifiedSwaggerData;

  if (fs.existsSync(targetFilePath)) {
    try {
      const existingYamlContent = fs.readFileSync(targetFilePath, 'utf8');
      const existingSwaggerData = yaml.load(existingYamlContent);

      console.log('📁 Found existing swagger file, merging...');
      finalSwaggerData = mergeSwaggerData(modifiedSwaggerData, existingSwaggerData);
      console.log('✅ Merge completed');
    } catch (mergeError) {
      console.warn('⚠️  Failed to merge with existing file, using new data only:', mergeError.message);
      finalSwaggerData = modifiedSwaggerData;
    }
  }

  const yamlData = yaml.dump(finalSwaggerData);

  await writeFileToPath(targetFilePath, yamlData);

  console.log('✅  Successfully imported and converted swagger file to YAML.');
} catch (e) {
  console.error('❗️ Failed to import and convert swagger file.', e);
}
