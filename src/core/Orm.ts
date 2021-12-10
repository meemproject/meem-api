import path from 'path'
import globby from 'globby'
import pg from 'pg'
import { Sequelize, SyncOptions } from 'sequelize'
import Umzug from 'umzug'
import { AppModel, IModels } from '../types/models'

export default class ORM {
	// @ts-ignore
	public sequelize: Sequelize & typeof Sequelize

	public models!: IModels

	public async init() {
		const models: {
			[modelName: string]: AppModel
		} = {}

		// if (/^sqlite:/.test(this.uri)) {
		// 	// Sequelize doesn't parse sqlite strings properly in edge cases: https://github.com/sequelize/sequelize/issues/9691
		// 	// @ts-ignore
		// 	this.sequelize = new Sequelize({
		// 		...options,
		// 		dialect: 'sqlite',
		// 		storage: this.uri.replace('sqlite:', '')
		// 	})
		// } else {
		// 	// @ts-ignore
		// 	this.sequelize = new Sequelize(this.uri, options)
		// }

		this.sequelize = new Sequelize(config.DATABASE_URL, {
			ssl: config.ORM_DISABLE_SSL ? undefined : true,
			dialectOptions: config.ORM_DISABLE_SSL
				? {
						ssl: {
							require: !config.ORM_DISABLE_SSL,
							rejectUnauthorized: config.ORM_ALLOW_UNAUTHORIZED
						}
				  }
				: undefined,
			pool: {
				max: config.DATABASE_POOL_MAX,
				min: config.DATABASE_POOL_MIN,
				idle: config.DATABASE_POOL_IDLE
			}
		}) as Sequelize & typeof Sequelize

		const modelDirectory = path.resolve(
			configuration.currentPath,
			'models/**/*.ts'
		)

		const files = await globby(modelDirectory)

		const promises = files.map(async file => {
			try {
				log.trace(`Importing Model ---- ${file}`)
				const model = (await import(file)).default
				models[model.name] = model.initialize(this.sequelize)
			} catch (e) {
				log.crit(`Error Importing Model ${file}`)
				log.crit(e)
			}
		})
		await Promise.all(promises)
		// fs.readdirSync(this.files)
		// 	.filter(file => {
		// 		return file.indexOf('.') !== 0 && file !== 'index.js'
		// 	})
		// 	.forEach(file => {
		// 		if (file.match(/^[^_].*\.(ts|js)$/)) {
		// 			// import each model DOCS: http://sequelize.readthedocs.org/en/latest/api/sequelize/#importpath-model
		// 			log.trace(`Importing Model ---- ${file}`)
		// 			try {
		// 				// const model = sequelize.import(path.resolve(this.files, file))
		// 				// models[model.name] = model
		// 				const filepath = path.resolve(this.files, file)
		// 				// @ts-ignore
		// 				const model = require(filepath).default // eslint-disable-line
		// 				// @ts-ignore
		// 				models[model.name] = model.initialize(this.sequelize)
		// 			} catch (e) {
		// 				log.crit(`Error Importing Model ${file}`)
		// 				log.crit(e)
		// 			}
		// 		}
		// 	})

		if (Object.keys(models).length === 0) {
			log.warn('---- Warning: No models were detected for the ORM -----')
			return
		}

		Object.keys(models).forEach(modelName => {
			// @ts-ignore
			if ('associate' in models[modelName]) {
				// @ts-ignore
				models[modelName].associate(models)
				log.trace('Creating Associations for - ', modelName)
			}
		})

		this.models = models as unknown as IModels

		if (!config.DISABLE_MIGRATIONS) {
			await this.runMigrations()
		}

		try {
			if (!config.DISABLE_ORM_SYNC) {
				log.info('Start Sync ORM')
				await this.sequelize.sync({
					force: config.ORM_FORCE_SYNC
				})
			} else {
				log.info('ORM sync disabled')
			}
		} catch (e) {
			log.warn(e)
		}
	}

	public createDatabase() {
		log.debug('createDatabase')
		return new Promise((resolve, reject) => {
			const matches = config.DATABASE_URL.match(/(.*)\/([^/]+)$/)
			if (!matches || !matches[1] || !matches[2]) {
				reject(new Error('Unable to parse database url'))
				return
			}
			const dbUrl = `${matches[1]}/postgres`
			const dbName = matches[2]
			log.debug('Connecting to db url:', dbUrl)
			// @ts-ignore
			pg.connect(dbUrl, (err, client) => {
				if (err) {
					reject(err)
					return
				}
				log.debug('Connected to db')
				// create the db and ignore any errors, for example if it already exists.
				const query = `CREATE DATABASE ${dbName}`
				log.debug('Executing:', query)
				client.query(query, (queryErr: any) => {
					if (queryErr) {
						// If the db already exists, resolve
						if (queryErr.code === '42P04') {
							log.debug('Database already exists.')
							client.end()
							resolve(null)
							return
						}

						client.end()
						reject(queryErr)
						return
					}
					client.end()
					log.debug('Database created:', dbName)
					resolve(null)
				})
			})
		})
	}

	public async runSync(options?: SyncOptions) {
		try {
			const timer = log.timerStart()
			await this.sequelize.sync(options)
			log.info(`ORM Sync: ${(log.timerEnd(timer) / 1000).toFixed(4)} seconds`)
		} catch (e) {
			log.warn(e)
		}
	}

	public async runMigrations() {
		const umzug = new Umzug({
			storage: 'sequelize',
			storageOptions: {
				sequelize: this.sequelize
			},
			// @ts-ignore
			migrations: {
				params: [
					this.sequelize.getQueryInterface(),
					this.sequelize.constructor,
					function migrationError() {
						throw new Error(
							'Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.'
						)
					}
				],
				path: path.join(configuration.currentPath, 'migrations'),
				pattern: /\.(js|ts)$/,
				wrap: fun => {
					return async (queryInterface: any, sequelize: any) => {
						if (fun) {
							try {
								// @ts-ignore
								await fun(queryInterface, sequelize)
							} catch (e) {
								// eslint-disable-next-line no-console
								console.log(e)
							}
						}
					}
				}
			}
		})
		try {
			await umzug.up()
		} catch (e) {
			log.crit('Error running migrations!')
			log.crit(e)
		}
	}
}
