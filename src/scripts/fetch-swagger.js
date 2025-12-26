import path from 'node:path';
import { kebabCase } from 'es-toolkit';
import yaml from 'js-yaml';
import minimist from 'minimist';
import { fetchSwagger } from '../utils/fetch-swagger';
import { readFileIfExists, writeFileToPath } from '../utils/file';
import { log } from '../utils/log';
import { isUrl } from '../utils/url';

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
const loadConfig = async (configPath) => {
  try {
    const configModule = await import(path.resolve(process.cwd(), configPath));
    return configModule.config;
  } catch {
    console.error(`❌ 설정 파일을 불러올 수 없습니다: ${configPath}`);
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

/**
 * 객체에서 x-로 시작하는 프로퍼티들을 추출합니다.
 * @param {object} obj - 검사할 객체
 * @returns {object} x- 프로퍼티들만 포함하는 객체
 */
const extractXProperties = (obj) => {
  if (!obj || typeof obj !== 'object') return {};

  const xProps = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('x-')) {
      xProps[key] = value;
    }
  }
  return xProps;
};

/**
 * paths의 각 엔드포인트에 x- 프로퍼티들을 병합합니다.
 * @param {object} existingPaths - 기존 swagger의 paths
 * @param {object} newPaths - 새로 fetch한 swagger의 paths
 * @returns {{paths: object, preservedXProps: Array}} x- 프로퍼티가 병합된 paths와 유지된 x- 프로퍼티 정보
 */
const mergeXPropertiesInPaths = (existingPaths, newPaths) => {
  if (!existingPaths || !newPaths) return { paths: newPaths, preservedXProps: [] };

  const mergedPaths = { ...newPaths };
  const preservedXProps = [];

  for (const [path, pathItem] of Object.entries(existingPaths)) {
    if (mergedPaths[path]) {
      // path 레벨의 x- 프로퍼티 병합
      const pathXProps = extractXProperties(pathItem);
      if (Object.keys(pathXProps).length > 0) {
        preservedXProps.push({
          endpoint: path,
          method: '-',
          xProperties: Object.keys(pathXProps).join(', '),
        });
      }
      mergedPaths[path] = { ...mergedPaths[path], ...pathXProps };

      // HTTP method 레벨의 x- 프로퍼티 병합
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
      for (const method of methods) {
        if (pathItem[method] && mergedPaths[path][method]) {
          const methodXProps = extractXProperties(pathItem[method]);
          if (Object.keys(methodXProps).length > 0) {
            preservedXProps.push({
              endpoint: path,
              method: method.toUpperCase(),
              xProperties: Object.keys(methodXProps).join(', '),
            });
          }
          mergedPaths[path][method] = { ...mergedPaths[path][method], ...methodXProps };
        }
      }
    }
  }

  return { paths: mergedPaths, preservedXProps };
};

/**
 * 전체 swagger spec에서 x- 프로퍼티들을 병합합니다.
 * @param {object} existingSwagger - 기존 swagger spec
 * @param {object} newSwagger - 새로 fetch한 swagger spec
 * @returns {{swagger: object, preservedXProps: Array}} x- 프로퍼티가 병합된 swagger spec과 유지된 x- 프로퍼티 정보
 */
const mergeXProperties = (existingSwagger, newSwagger) => {
  const merged = { ...newSwagger };
  let preservedXProps = [];

  // 루트 레벨의 x- 프로퍼티 병합
  const rootXProps = extractXProperties(existingSwagger);
  Object.assign(merged, rootXProps);

  // paths의 x- 프로퍼티 병합
  if (existingSwagger.paths) {
    const result = mergeXPropertiesInPaths(existingSwagger.paths, newSwagger.paths);
    merged.paths = result.paths;
    preservedXProps = result.preservedXProps;
  }

  return { swagger: merged, preservedXProps };
};

try {
  const swaggerData = await fetchSwagger(config.uri, config.username, config.password);

  // 출력 경로 결정
  const targetFilePath = output
    ? path.resolve(process.cwd(), output)
    : path.resolve(process.cwd(), `swagger/${kebabCase(swaggerData.info.title)}.yml`);

  // 기존 파일이 있으면 읽어서 x- 프로퍼티 병합
  const existingFileContent = await readFileIfExists(targetFilePath);
  let finalSwaggerData = swaggerData;

  if (existingFileContent) {
    try {
      const existingSwagger = yaml.load(existingFileContent);

      // x- 프로퍼티 병합
      const mergeResult = mergeXProperties(existingSwagger, swaggerData);
      finalSwaggerData = mergeResult.swagger;

      // 유지된 x- 프로퍼티 출력
      if (mergeResult.preservedXProps.length > 0) {
        console.log('\n유지된 x- 프로퍼티:');
        console.table(
          mergeResult.preservedXProps.map((item) => ({
            엔드포인트: item.endpoint,
            메서드: item.method,
            'x- 프로퍼티': item.xProperties,
          })),
        );
      }
    } catch (parseError) {
      log.warn('기존 파일을 파싱할 수 없어 x- 프로퍼티 병합을 건너뜁니다.');
    }
  }

  const yamlData = yaml.dump(finalSwaggerData);

  await writeFileToPath(targetFilePath, yamlData);

  log.success('Successfully imported and converted swagger file to YAML.');
} catch (e) {
  log.error('Failed to import and convert swagger file.', e);
}
