import path from 'path'
import { MeemAPI } from '../types/meem.generated'
import errors from './errors'

// eslint-disable-next-line
const packageJSON = require(path.join(process.cwd(), 'package.json'))

export default {
	version: packageJSON.version as string,
	errors,
	PORT: process.env.PORT ?? 1313,
	SERVER_LISTENING: process.env.SERVER_LISTENING !== 'false',
	SERVERLESS: process.env.SERVERLESS === 'true',
	LOG_LEVEL: process.env.LOG_LEVEL ?? 'warn',
	ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING === 'true',
	GENERATE_SHARED_TYPES: process.env.GENERATE_SHARED_TYPES === 'true',
	TESTING: process.env.TESTING === 'true',
	DISABLE_RATE_LIMIT: process.env.DISABLE_RATE_LIMIT === 'true',

	DATABASE_URL: process.env.DATABASE_URL ?? 'sqlite::memory:',
	DATABASE_URL_TESTING:
		process.env.DATABASE_URL_TESTING ||
		`sqlite:${__dirname}/../../tmp/testing.db`,
	DISABLE_MIGRATIONS: process.env.DISABLE_MIGRATIONS === 'true',
	DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX
		? +process.env.DATABASE_POOL_MAX
		: 5,
	DATABASE_POOL_MIN: process.env.DATABASE_POOL_MIN
		? +process.env.DATABASE_POOL_MIN
		: 0,
	DATABASE_POOL_IDLE: process.env.DATABASE_POOL_IDLE
		? +process.env.DATABASE_POOL_IDLE
		: 10000,
	ORM_DISABLE: process.env.ORM_DISABLE === 'true',
	ORM_FORCE_SYNC: process.env.ORM_FORCE_SYNC === 'true',
	ORM_DISABLE_SSL: process.env.ORM_DISABLE_SSL === 'true',
	ORM_ALLOW_UNAUTHORIZED: process.env.ORM_ALLOW_UNAUTHORIZED === 'true',

	CORS_ALLOW_ALL: process.env.CORS_ALLOW_ALL === 'true',
	CORS_DEFAULT_ORIGIN: process.env.CORS_DEFAULT_ORIGIN ?? '',
	CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS
		? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
		: [],

	REDIS_URL: process.env.REDIS_URL,
	REDIS_ENABLED: process.env.REDIS_ENABLED !== 'false',
	// Default cache TTL in seconds
	REDIS_DEFAULT_TTL: process.env.REDIS_DEFAULT_TTL
		? +process.env.REDIS_DEFAULT_TTL
		: 300,
	// Only needed if redis is being shared by multiple API instances on different environments
	REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX,
	AWS_WEBSOCKET_GATEWAY_URL: process.env.AWS_WEBSOCKET_GATEWAY_URL,
	SERVERLESS_LOG_FULL_REQUEST: process.env.SERVERLESS_LOG_FULL_REQUEST,
	NETWORK: (process.env.NETWORK ?? 'rinkeby') as MeemAPI.NetworkName,
	WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY ?? '',
	MEEM_PROXY_ADDRESS: process.env.MEEM_PROXY_ADDRESS ?? '',
	INFURA_ID: process.env.INFURA_ID ?? '',
	IPFS_CONTENT_GATEWAY_URL:
		process.env.IPFS_CONTENT_GATEWAY_URL ?? 'https://gateway.ipfs.io',
	GITHUB_KEY: process.env.GITHUB_KEY ?? '',
	ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY ?? ''
}
