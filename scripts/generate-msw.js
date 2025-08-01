#!/usr/bin/env node

import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import minimist from "minimist";
import { writeFileToPath } from "../utils/file.js";

const execAsync = promisify(exec);

const argv = minimist(process.argv.slice(2), {
	string: ["swagger-path", "api-base-url", "package-manager"],
	alias: {
		s: "swagger-path",
		a: "api-base-url",
		pm: "package-manager",
	},
});

const {
	"swagger-path": swaggerPath,
	"package-manager": packageManager = "pnpm",
} = argv;

const baseUrlArg = argv["api-base-url"] || "https://api.example.com/v1";

if (!swaggerPath) {
	console.error("❗️ Error: Please provide the swagger URL");
	console.error(
		"Usage: node generate-msw.js --swagger-path <swagger-path> [--api-base-url <api-base-url>] [--package-manager <package-manager>]",
	);
	process.exit(1);
}

const outPath = path.resolve(process.cwd(), "msw");
const command = `${packageManager} msw-auto-mock ${swaggerPath} -o ${outPath} --base-url ${baseUrlArg}`;

const convertToTs = async (filePath) => {
	try {
		if (path.extname(filePath) !== ".js") {
			console.error("❗ The file is not a .js file.");
			return;
		}

		const newFilePath = filePath.replace(/\.js$/, ".ts");

		await fs.rename(filePath, newFilePath);
		console.log(
			`✅ File converted successfully from ${filePath} to ${newFilePath}`,
		);
	} catch (err) {
		console.error(`⚠️ Error converting file: ${err.message}`);
	}
};

try {
	const { stderr } = await execAsync(command);

	if (stderr) {
		console.error(`⚠️ Error output: ${stderr}`);
	}

	console.log("✅ Msw handler was successfully created.");

	await fs.unlink(path.resolve(outPath, "native.js"));

	await convertToTs(path.resolve(outPath, "browser.js"));
	await convertToTs(path.resolve(outPath, "node.js"));

	const handlerFileContent = await fs.readFile(
		path.resolve(outPath, "handlers.js"),
		"utf-8",
	);

	const updatedContent = handlerFileContent
		.replaceAll(
			"...resultArray[next() % resultArray.length]",
			"...responseSelector(request, resultArray)",
		)
		.replaceAll("async () => {", "async ({ request }) => {")
		.replaceAll(
			"import { faker } from '@faker-js/faker';",
			"import { faker } from '@faker-js/faker';\n" +
				"import { responseSelector } from '~/msw/utils/response';",
		)
		.replaceAll(
			"let i = 0;\n" +
				"const next = () => {\n" +
				"  if (i === Number.MAX_SAFE_INTEGER - 1) {\n" +
				"    i = 0;\n" +
				"  }\n" +
				"  return i++;\n" +
				"};\n\n",
			"",
		)
		.replaceAll(
			"import { faker } from '@faker-js/faker';",
			"import { Faker, ko } from '@faker-js/faker';",
		)
		.replaceAll(
			"faker.seed(1);",
			"const faker = new Faker({ locale: [ko] });\nfaker.seed(1);",
		);

	await writeFileToPath(path.resolve(outPath, "handlers.js"), updatedContent);
} catch (err) {
	console.log(err);
	console.error(`⚠️ Error executing script: ${err.message}`);
}
