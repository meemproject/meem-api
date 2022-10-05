import { createHash } from 'crypto'
import path from 'path'
import globby from 'globby'
import pg from 'pg'
import { Sequelize, SyncOptions } from 'sequelize'
import Umzug from 'umzug'
import { AppModel, IModels } from '../types/models'

function strToKey(str: string) {
	const buf = createHash('sha256').update(str).digest()
	return [buf.readInt32LE(0), buf.readInt32LE(4)]
}

function sleep(time: number) {
	return new Promise(resolve => setTimeout(resolve, time))
}

export default class ORM {
	// @ts-ignore
	public sequelize: Sequelize & typeof Sequelize

	public models!: IModels

	public client!: pg.Client

	public databaseId!: number

	public async init() {
		const models: {
			[modelName: string]: AppModel
		} = {}

		if (!config.TESTING) {
			this.client = new pg.Client(config.DATABASE_URL)
			await this.client.connect()
			this.databaseId = await this.initTable()
		}

		this.sequelize = new Sequelize(config.DATABASE_URL, {
			// eslint-disable-next-line no-console
			logging: config.ORM_LOGGING ? console.log : undefined,
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
			'models/**/*.(ts|js)'
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
				const timer = log.timerStart()
				await this.sequelize.sync({
					force: config.ORM_FORCE_SYNC
				})
				log.info(`ORM sync: ${(log.timerEnd(timer) / 1000).toFixed(4)} seconds`)
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

	public async acquireLock(key: string) {
		if (config.TESTING) {
			return true
		}
		const [classid, objid] = strToKey(key)

		// Check in session lock
		for (let i = 0; i < config.PG_LOCK_RETRY_COUNT; i++) {
			const time = +new Date()
			while (+new Date() - time < config.PG_LOCK_TIMEOUT) {
				const res = await this.client.query(
					`
                    SELECT
                        CASE count(*) WHEN 0 THEN (SELECT pg_try_advisory_lock($1, $2))
                                    ELSE FALSE
                        END as pg_try_advisory_lock
                    FROM
                        pg_locks
                    WHERE
                        pid = (
                            SELECT
                                pg_backend_pid()
                            )
                        AND locktype = 'advisory'
                        AND classid = $1 AND objid = $2
                        AND "database" = $3;
                `,
					[classid, objid, this.databaseId]
				)
				if (res.rows[0].pg_try_advisory_lock == true) return true

				await sleep(100)
			}
		}

		throw Error('Cannot acquire lock')
	}

	public async releaseLock(key: string): Promise<boolean> {
		if (config.TESTING) {
			return true
		}
		const [classid, objid] = strToKey(key)

		const res = await this.client.query(
			`
            SELECT pg_advisory_unlock($1, $2);
        `,
			[classid, objid]
		)

		return res.rows[0].pg_advisory_unlock
	}

	private async initTable(): Promise<number> {
		const matches = config.DATABASE_URL.match(/\/([a-zA-Z0-9]+)$/)
		const dbName = matches && matches[1]

		if (!matches) {
			throw new Error('Invalid db url')
		}

		const res = await this.client.query(
			`
			SELECT oid from pg_database WHERE datname=$1;
		`,
			[dbName]
		)
		if (res.rowCount == 0) throw Error('Table does not exists!!')

		return res.rows[0].oid
	}
}
