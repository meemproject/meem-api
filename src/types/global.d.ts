/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-named-default */
/* eslint-disable import/no-extraneous-dependencies */

import { default as logger } from '@kengoldfarb/log'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { RouterOptions } from 'express'
import { IGunChainReference } from 'gun/types/chain'
import defaultConfig from '../config/default'
import Configuration from '../core/Configuration'
import Orm from '../core/Orm'
import { IAppRouter } from '../core/router'
import Sockets from '../core/Sockets'
import MeemIdentification from '../models/MeemIdentification'

declare const configuration: Configuration
declare const sockets: Sockets | undefined
declare const config: typeof defaultConfig
declare const log: typeof logger
declare const orm: Orm

declare global {
	const configuration: Configuration
	const sockets: Sockets | undefined
	const config: typeof defaultConfig
	const log: typeof logger
	const orm: Orm
	const gun: IGunChainReference
	const signer: SignerWithAddress | undefined

	namespace NodeJS {
		interface Global {
			configuration: Configuration
			sockets?: Sockets
			orm: Orm
			config: typeof defaultConfig
			log: typeof logger
			signer: SignerWithAddress | undefined
		}
	}

	namespace Express {
		interface IMeemRequest {
			meemId?: MeemIdentification
			limit?: number
			page?: number
		}

		export interface Response {
			error(e: Error): any
		}

		export function Router(options?: RouterOptions): IAppRouter

		export interface Request extends IMeemRequest {}
	}
}
