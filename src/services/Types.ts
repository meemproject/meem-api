/* eslint-disable no-await-in-loop */
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import globby from 'globby'
import _ from 'lodash'
import slug from 'slug'
import { runTypeChain } from 'typechain'
import { v4 as uuidv4 } from 'uuid'
import Bundle from '../models/Bundle'
import lintConfig from '../types/.eslintrc'
import { MeemAPI } from '../types/meem.generated'

export default class TypesService {
	/** Creates the generated types file */
	public static async generateTypesFiles(): Promise<void> {
		const { types: allTypes } = await this.getSharedTypes({
			includeProjectTypes: true
		})
		const { types: publicTypes } = await this.getSharedTypes({
			includeProjectTypes: false
		})
		const { allTypesPath } = this.getAllTypesPath()
		const { publicTypesPath } = this.getPublicTypesPath()

		// Get eslint headers
		let header = ''
		Object.keys(lintConfig.rules).forEach(rule => {
			// @ts-ignore
			if (lintConfig.rules[rule] === 0) {
				header += `/* eslint-disable ${rule} */\n`
			}
		})

		await Promise.all([fs.writeFile(allTypesPath, header + allTypes)])
		await Promise.all([services.lint.fix(allTypesPath)])

		await Promise.all([fs.writeFile(publicTypesPath, header + publicTypes)])
		await Promise.all([services.lint.fix(publicTypesPath)])
	}

	/** Gets type definitions shared by the API. This can be written to a file */
	public static async getSharedTypes({
		includeProjectTypes
	}: {
		includeProjectTypes: boolean
	}): Promise<{
		types: string
	}> {
		const sharedTypesGlob = path.join(process.cwd(), 'src/types/shared/**/*.ts')
		const endpointsGlob = path.join(
			process.cwd(),
			'src/types/shared/api/**/*.ts'
		)
		const projectTypesGlob = path.join(
			process.cwd(),
			'src/types/projects/**/*.ts'
		)
		const projectEndpointsGlob = path.join(
			process.cwd(),
			'src/types/projects/*/api/**/*.ts'
		)

		const [files, endpointFiles, projectFiles, projectEndpointFiles] =
			await Promise.all([
				globby(sharedTypesGlob, {
					ignore: [endpointsGlob]
				}),
				globby(endpointsGlob),
				globby(projectTypesGlob, { ignore: [projectEndpointsGlob] }),
				globby(projectEndpointsGlob)
			])

		files.sort()
		endpointFiles.sort()
		projectFiles.sort()
		projectEndpointFiles.sort()

		const [types, endpointTypes, projectTypes, projectEndpointTypes] =
			await Promise.all([
				Promise.all(files.map(f => this.parseTypes(f))),
				Promise.all(endpointFiles.map(f => this.parseTypes(f))),
				Promise.all(projectFiles.map(f => this.parseTypes(f))),
				Promise.all(projectEndpointFiles.map(f => this.parseTypes(f)))
			])

		let typesConcat = types.join('\n\n')

		let endpointTypesConcat = endpointTypes.join('\n\n')

		if (includeProjectTypes) {
			typesConcat += `\n\n${projectTypes.join('\n\n')}`
			endpointTypesConcat += `\n\n${projectEndpointTypes.join('\n\n')}`
		}

		const allTypes = `export namespace MeemAPI {\n${typesConcat}\nexport namespace v1 {\n${endpointTypesConcat}\n}}`

		return { types: allTypes }
	}

	public static getPublicTypesPath() {
		return {
			publicTypesPath: path.join(
				process.cwd(),
				'src/types/meem.public.generated.ts'
			)
		}
	}

	public static getAllTypesPath() {
		return {
			allTypesPath: path.join(process.cwd(), 'src/types/meem.generated.ts')
		}
	}

	public static async generateContractTypes(
		options: MeemAPI.v1.GenerateTypes.IRequestBody & {
			shouldForceUpdate?: boolean
		}
	) {
		const { bundleId, shouldForceUpdate } = options
		let abi = options.abi ?? []
		const name = slug(options.name ?? 'MyContract')

		let bundle: Bundle | undefined | null

		if (bundleId) {
			bundle = await orm.models.Bundle.findOne({
				where: {
					id: bundleId
				},
				include: [orm.models.Contract]
			})

			if (!bundle) {
				throw new Error('BUNDLE_NOT_FOUND')
			}

			if (
				bundle.abi.length > 0 &&
				bundle.types.length > 0 &&
				!shouldForceUpdate
			) {
				return {
					types: bundle.types,
					abi: bundle.abi
				}
			}

			bundle.Contracts?.forEach(contract => {
				abi = [...abi, ...contract.abi]
			})
		}

		abi = _.uniqWith(abi, _.isEqual)

		// const tmpFile = path.join(os.tmpdir(), `${uuidv4()}.json`)
		const tmpFile = path.join(os.tmpdir(), `${name}.json`)
		const outDir = path.join(os.tmpdir(), uuidv4())

		await fs.createFile(tmpFile)
		await fs.ensureDir(outDir)
		await fs.writeFile(tmpFile, JSON.stringify(abi))

		log.trace(`Created temp abi at: ${tmpFile}`)

		await runTypeChain({
			cwd: process.cwd(),
			filesToProcess: [tmpFile],
			allFiles: [tmpFile],
			target: 'ethers-v5',
			outDir
		})

		log.trace(`Wrote types to: ${outDir}`)
		let types = '/* eslint-disable */\n'
		let body = ''
		const files = await globby(path.join(outDir, '**/*.ts'))
		const imports: {
			[packageName: string]: string[]
		} = {}

		for (let i = 0; i < files.length; i += 1) {
			const file = files[i]
			if (!/index.ts$/.test(file)) {
				log.debug(file)
				const contents = (await fs.readFile(file)).toString()

				const matches = contents.match(
					/import[^;]*{([^;]*)}[^;]*from[^;]*"([^;]*)";/g
				)

				matches?.forEach(m => {
					const parts = m.match(/import[^;]*{([^;]*)}[^;]*from[^;]*"([^;]*)";/)
					if (parts && parts[1] && parts[2]) {
						const vars = parts[1].split(',').map(p => p.trim())
						const pkgName = parts[2].trim()
						if (!/^\./.test(pkgName)) {
							if (!imports[pkgName]) {
								imports[pkgName] = []
							}
							imports[pkgName] = imports[pkgName].concat(vars)
						}
					}
				})

				const rest = contents.replace(/import[^;]*;/g, '')
				// log.debug(rest)
				body += rest
			}
		}

		log.debug(imports)

		Object.keys(imports).forEach(pkgName => {
			const vars = _.uniq(imports[pkgName]).filter(p => p.length !== 0)
			types += `import { ${vars.join(', ')} } from '${pkgName}';\n`
		})

		types += `\n\n${body}`

		if (bundle) {
			bundle.abi = abi
			bundle.types = types
			await bundle.save()
		}

		return {
			types,
			abi
		}
	}

	/** Reads a file and strips out all the imports, etc. leaving just the types */
	private static async parseTypes(file: string) {
		const contents = await fs.readFile(file)

		// Strip out any imports
		let typesOnly = contents.toString().replace(/import[^]+} from.*\n/g, '')

		// Strip out OpenAPI Definitions
		if (typesOnly.match(/\/\*\* === OpenAPI Definition === \*\/(.*)/s)) {
			typesOnly = typesOnly.replace(
				/\/\*\* === OpenAPI Definition === \*\/(.*)/s,
				''
			)
		}

		return typesOnly
	}
}
