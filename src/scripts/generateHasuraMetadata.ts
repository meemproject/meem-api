/* eslint-disable no-console */
import path from 'path'
import log from '@kengoldfarb/log'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import { tables } from '../hasura/tables'

const run = async () => {
	const dotenvpath = path.join(process.cwd(), '.env')
	await dotenv.config({ path: dotenvpath })

	const metadata = {
		resource_version: 330,
		metadata: {
			version: 3,
			sources: [
				{
					name: process.env.HASURA_DATABASE_NAME,
					kind: 'postgres',
					tables,
					configuration: {
						connection_info: {
							database_url: process.env.HASURA_DATABASE_URL,
							isolation_level: 'read-committed',
							pool_settings: {
								connection_lifetime: 600,
								total_max_connections: 10
							},
							use_prepared_statements: false
						}
					}
				}
			],
			api_limits: {
				disabled: false,
				time_limit: {
					global: 10,
					per_role: {}
				}
			},
			backend_configs: {
				dataconnector: {
					athena: {
						uri: 'http://localhost:8081/api/v1/athena'
					},
					snowflake: {
						uri: 'http://localhost:8081/api/v1/snowflake'
					}
				}
			}
		}
	}

	const now = Math.floor(new Date().getTime() / 1000)

	const directory = path.join(process.cwd(), 'tmp', 'hasura')

	await fs.ensureDir(directory)
	const filename = path.join(directory, `metadata-${now}.json`)
	await fs.writeFile(filename, JSON.stringify(metadata))

	log.info(`🎉🎉🎉  Generated hasura metadata at: ${filename}`)
}

run()
	.then(() => {})
	.catch(e => {
		log.crit(e)
	})
