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
	SERVER_ADMIN_KEY: process.env.SERVER_ADMIN_KEY ?? 'xGugNAB2PEX4uY4sPF',
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
	DISABLE_ORM_SYNC: process.env.DISABLE_ORM_SYNC === 'true',
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
	APP_AWS_ACCESS_KEY_ID: process.env.APP_AWS_ACCESS_KEY_ID ?? '',
	APP_AWS_SECRET_ACCESS_KEY: process.env.APP_AWS_SECRET_ACCESS_KEY ?? '',
	NETWORK: (process.env.NETWORK ?? 'rinkeby') as MeemAPI.NetworkName,
	WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY ?? '',
	MEEM_PROXY_ADDRESS: process.env.MEEM_PROXY_ADDRESS ?? '',
	MEEM_ID_PROXY_ADDRESS: process.env.MEEM_ID_PROXY_ADDRESS ?? '',
	INFURA_ID: process.env.INFURA_ID ?? '',
	IPFS_CONTENT_GATEWAY_URL:
		process.env.IPFS_CONTENT_GATEWAY_URL ?? 'https://gateway.ipfs.io',
	GITHUB_KEY: process.env.GITHUB_KEY ?? '',
	ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY ?? '',
	DYNAMODB_SOCKETS_TABLE: process.env.DYNAMODB_SOCKETS_TABLE ?? '',
	DYNAMODB_TWEET_CHECKPOINTS_TABLE:
		process.env.DYNAMODB_TWEET_CHECKPOINTS_TABLE ?? '',
	ENABLE_TEST_ENDPOINTS: process.env.ENABLE_TEST_ENDPOINTS === 'true',
	WEBSOCKETS_ENABLED: process.env.WEBSOCKETS_ENABLED === 'true',
	LAMBDA_MINT_FUNCTION: process.env.LAMBDA_MINT_FUNCTION ?? '',
	DISABLE_ASYNC_MINTING: process.env.DISABLE_ASYNC_MINTING === 'true',
	S3_BUCKET: process.env.S3_BUCKET ?? '',
	MORALIS_API_KEY: process.env.MORALIS_API_KEY ?? '',
	JSON_RPC_MAINNET:
		process.env.JSON_RPC_MAINNET ??
		'https://speedy-nodes-nyc.moralis.io/47bc53fc4b72dbd2d8582fea/eth/mainnet',
	JSON_RPC_RINKEBY:
		process.env.JSON_RPC_RINKEBY ??
		'https://speedy-nodes-nyc.moralis.io/47bc53fc4b72dbd2d8582fea/eth/rinkeby',
	JSON_RPC_POLYGON:
		process.env.JSON_RPC_POLYGON ??
		'https://speedy-nodes-nyc.moralis.io/47bc53fc4b72dbd2d8582fea/polygon/mainnet',
	ENABLE_WHITELIST_TEST_DATA: process.env.ENABLE_WHITELIST_TEST_DATA === 'true',
	MAX_GAS_PRICE_GWEI: process.env.MAX_GAS_PRICE_GWEI
		? +process.env.MAX_GAS_PRICE_GWEI
		: 50,
	MIN_GASE_PRICE_GWEI: process.env.MIN_GASE_PRICE_GWEI
		? +process.env.MIN_GASE_PRICE_GWEI
		: 31,
	GAS_ESTIMATE_THRESHOLD_GWEI: process.env.GAS_ESTIMATE_THRESHOLD_GWEI
		? +process.env.GAS_ESTIMATE_THRESHOLD_GWEI
		: 10,
	DISABLE_TWITTER_STREAM: process.env.DISABLE_TWITTER_STREAM === 'true',
	TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY ?? '',
	TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET ?? '',
	TWITTER_AUTH_CALLBACK_URL: process.env.TWITTER_AUTH_CALLBACK_URL ?? '',
	TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN ?? '',
	TWITTER_MEEM_ACCOUNT_ID: process.env.TWITTER_MEEM_ACCOUNT_ID ?? '',
	TWITTER_MEEM_ACTION: process.env.TWITTER_MEEM_ACTION ?? '',
	MEEM_AUCTION_PROXY_ADDRESS: process.env.MEEM_AUCTION_PROXY_ADDRESS ?? '',
	MEEM_AUCTION_CURRENCY_ADDRESS: process.env.MEEM_AUCTION_CURRENCY_ADDRESS ?? ''
}
