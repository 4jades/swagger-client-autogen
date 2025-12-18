import path from 'node:path';

export const getAbsoluteFilePath = (filePath: string) => {
  return path.resolve(process.cwd(), filePath);
};

export const generateAlias = (outputPath: string, aliasMap: Record<string, string>): string => {
  for (const [aliasPrefix, aliasRootPath] of Object.entries(aliasMap)) {
    if (outputPath.startsWith(aliasRootPath)) {
      const relativePath = outputPath.slice(aliasRootPath.length + 1);
      return `${aliasPrefix}/${relativePath}`.replace(/\.ts$/, '');
    }
  }

  return outputPath.replace(/\.ts$/, '');
};
