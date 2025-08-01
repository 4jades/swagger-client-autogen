import path from "node:path";

export const getAbsoluteFilePath = (filePath: string) => {
	return path.resolve(process.cwd(), filePath);
};