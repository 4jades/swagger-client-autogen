import fs from 'node:fs';
import path from 'node:path';
import { log } from './log';

export const writeFileToPath = async (filePath: string, fileContent: string): Promise<void> => {
  const outputDir = path.dirname(filePath);
  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
    await fs.promises.writeFile(filePath, fileContent);
    log.success(`Successfully wrote file at ${filePath}`);
  } catch (err) {
    log.error(`Failed to write file at ${filePath}: ${err}`);
  }
};

export const readFileIfExists = async (filePath: string): Promise<string | null> => {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (err) {
    return null;
  }
};
