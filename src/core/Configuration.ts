/* eslint-disable no-console */
import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import _ from 'lodash'

export default class Configuration {
	public currentPath: string

	public constructor() {
		if (
			(process.env.NODE_ENV === 'local' &&
				process.env.RUN_PRODUCTION !== 'true') ||
			process.env.TESTING === 'true'
		) {
			this.currentPath = `${process.cwd()}/src/`
		} else {
			this.currentPath = `${process.cwd()}/build/`
		}
	}

	public async load(): Promise<typeof defaultConfig> {
		const file = path.join(this.currentPath, 'config', this.env())
		const dotenvpath = path.join(process.cwd(), '.env')
		console.log(`Loading dotenv file: ${dotenvpath}`)
		await this.dotenv(dotenvpath)

		const defaultConfig = (await import('../config/default')).default

		const hasEnvConfig = await fs.pathExists(file)
		let envConfig = {}
		if (hasEnvConfig) {
			envConfig = (await import(file)).default
		}
		console.log({ defaultConfig })
		const combinedConfig = _.merge(defaultConfig, envConfig)
		return combinedConfig
	}

	private env() {
		return process.env.NODE_ENV || 'local'
	}

	private async dotenv(dotPath: string) {
		const hasDotfile = await fs.pathExists(dotPath)
		if (hasDotfile) {
			dotenv.config({
				debug: process.env.DOTENV_DEBUG === 'true' ? true : undefined,
				path: dotPath
			})
		}
	}
}
