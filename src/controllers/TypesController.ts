/* eslint-disable no-await-in-loop */
import os from 'os'
import path from 'path'
import { Response } from 'express'
import fs from 'fs-extra'
import globby from 'globby'
import _ from 'lodash'
import slug from 'slug'
import { runTypeChain } from 'typechain'
import { v4 as uuidv4 } from 'uuid'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class TypesController {
	public static async generateTypes(
		req: IRequest<MeemAPI.v1.GenerateTypes.IDefinition>,
		res: IResponse<MeemAPI.v1.GenerateTypes.IDefinition>
	): Promise<Response> {
		const { bundleId } = req.body
		let abi = req.body.abi ?? []
		const name = slug(req.body.name ?? 'MyContract')

		if (bundleId) {
			const bundle = await orm.models.Bundle.findOne({
				where: {
					id: bundleId
				},
				include: [orm.models.Contract]
			})

			if (!bundle) {
				throw new Error('BUNDLE_NOT_FOUND')
			}

			bundle.Contracts?.forEach(contract => {
				abi = [...abi, ...contract.abi]
			})
		}

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

		return res.json({
			types,
			abi
		})
	}
}
