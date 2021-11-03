/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-named-default */

import { default as logger } from '@kengoldfarb/log'
import { RouterOptions } from 'express'
import defaultConfig from '../config/default'
import Configuration from '../core/Configuration'
import Orm from '../core/Orm'
import { IAppRouter } from '../core/router'
import Sockets from '../core/Sockets'

declare global {
	const configuration: Configuration
	const sockets: Sockets | undefined
	const config: typeof defaultConfig
	const log: typeof logger
	const orm: Orm

	namespace NodeJS {
		interface Global {
			configuration: Configuration
			sockets?: Sockets
			orm: Orm
			config: typeof defaultConfig
			log: typeof logger
		}
	}

	namespace Express {
		export interface Response {
			error(e: Error): any
		}

		export function Router(options?: RouterOptions): IAppRouter
	}
}
