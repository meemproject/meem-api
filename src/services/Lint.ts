/* eslint-disable no-await-in-loop */
import fs from 'fs-extra'

export default class LintService {
	/** Lint fix based on a glob. Returns an array of filepaths that were fixed. */
	public static async fix(
		/** The file or pattern to run eslint --fix on */
		pattern: string
	): Promise<string[]> {
		if (!pattern) {
			throw new Error('LINT_FAILED')
		}

		const { stdout } = await services.child.executeCommand('node', {
			args: [
				'-e',
				`"try { const ESLint = require('eslint');const cli = new ESLint.CLIEngine({fix: true,cwd: '${process.cwd()}'});const result=cli.executeOnFiles(['${pattern}']);console.log(JSON.stringify(result)); } catch(err) { console.log(err.toString()); }"`
			]
		})

		const fixedPaths: string[] = []
		let fixedFiles: any = {}

		try {
			fixedFiles = JSON.parse(stdout)
		} catch (err) {
			log.warn(err)
			throw new Error('LINT_FAILED')
		}

		if (fixedFiles.results) {
			for (let i = 0; i < fixedFiles.results.length; i += 1) {
				const fixedFile = fixedFiles.results[i]
				if (fixedFile && fixedFile.output) {
					await fs.writeFile(fixedFile.filePath, fixedFile.output)
					fixedPaths.push(fixedFile.filePath)
				}
			}
		}

		return fixedPaths
	}
}
