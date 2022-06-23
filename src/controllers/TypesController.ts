import os from 'os'
import path from 'path'
import { Request, Response } from 'express'
import fs from 'fs-extra'
import { runTypeChain } from 'typechain'
import { v4 as uuidv4 } from 'uuid'

export default class TypesController {
	public static async generateTypes(
		req: Request,
		res: Response
	): Promise<Response> {
		const { abi, name } = req.body

		// const tmpFile = path.join(os.tmpdir(), `${uuidv4()}.json`)
		const tmpFile = path.join(os.tmpdir(), `${name}.json`)
		const outDir = path.join(os.tmpdir(), uuidv4())

		await fs.createFile(tmpFile)
		await fs.ensureDir(outDir)
		await fs.writeFile(tmpFile, JSON.stringify(abi))

		log.debug(`Created temp abi at: ${tmpFile}`)

		await runTypeChain({
			cwd: process.cwd(),
			filesToProcess: [tmpFile],
			allFiles: [tmpFile],
			target: 'ethers-v5',
			outDir
		})
		log.debug(`Wrote types to: ${outDir}`)

		return res.json({
			abi
		})
	}
}
