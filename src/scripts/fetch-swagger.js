import path from 'node:path';
import { kebabCase } from 'es-toolkit';
import yaml from 'js-yaml';
import minimist from 'minimist';
import { fetchSwagger } from '../utils/fetch-swagger';
import { writeFileToPath } from '../utils/file';
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

try {
  const swaggerData = await fetchSwagger(config.uri, config.username, config.password);

  // 출력 경로 결정
  const targetFilePath = output
    ? path.resolve(process.cwd(), output)
    : path.resolve(process.cwd(), `swagger/${kebabCase(swaggerData.info.title)}.yml`);

  const yamlData = yaml.dump(swaggerData);

  await writeFileToPath(targetFilePath, yamlData);

  log.success('Successfully imported and converted swagger file to YAML.');
} catch (e) {
  log.error('Failed to import and convert swagger file.', e);
}
