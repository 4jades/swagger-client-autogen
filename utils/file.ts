import path from 'node:path';
import fs from 'node:fs';

export const writeFileToPath = async (filePath, fileContent) => {
  const outputDir = path.dirname(filePath);
  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
    await fs.promises.writeFile(filePath, fileContent);
    console.log(`✅  Successfully wrote file at ${filePath}`);
  } catch (err) {
    console.error(`☠️   Failed to write file at ${filePath}: ${err}`);
  }
};

export const saveDto = async (outputPath, generateFiles) => {
  await writeFileToPath(
    outputPath,
    generateFiles.find(({ fileName }) => fileName === 'data-contracts').fileContent
  );
};

export const saveEntitiesFile = async (outputPath, generateFiles) => {
  for (const { fileName, fileContent } of generateFiles) {
    if (fileName === 'http-client' || fileName === 'data-contracts') continue;

    const moduleName = fileName.toLowerCase();
    const output = outputPath.replace('{moduleName}', moduleName);
    await writeFileToPath(output, fileContent);
  }
};