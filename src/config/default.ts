import path from 'path'
import { MeemAPI } from '../types/meem.generated'
import errors from './errors'

// eslint-disable-next-line
const packageJSON = require(path.join(process.cwd(), 'package.json'))

export default {
	version: packageJSON.version as string,
	errors,
	PORT: process.env.PORT ?? 1313,
	API_URL: process.env.API_URL ?? 1313,
	MEEM_DOMAIN:
		process.env.MEEM_DOMAIN ?? process.env.NETWORK === 'rinkeby'
			? 'https://dev.meem.wtf'
			: 'https://meem.wtf',
	SERVER_LISTENING: process.env.SERVER_LISTENING !== 'false',
	SERVER_ADMIN_KEY: process.env.SERVER_ADMIN_KEY ?? 'xGugNAB2PEX4uY4sPF',
	// JWT_SECRET:
	// 	process.env.JWT_SECRET ??
	// 	'ac741f40d71a2564e08180f5eb1cc9dd28e288ed75b33c34cba2fc18a3c31a64e719835877c7a6db9fdae8054037053172aba56f4dabc5f1b',
	JWT_RSA_PUBLIC_KEY: process.env.JWT_RSA_PUBLIC_KEY ?? '',
	JWT_RSA_PRIVATE_KEY: process.env.JWT_RSA_PRIVATE_KEY ?? '',
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN
		? +process.env.JWT_EXPIRES_IN
		: 604800, // 7 days
	SERVERLESS: process.env.SERVERLESS === 'true',
	LOG_LEVEL: process.env.LOG_LEVEL ?? 'warn',
	ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING === 'true',
	GENERATE_SHARED_TYPES: process.env.GENERATE_SHARED_TYPES === 'true',
	TESTING: process.env.TESTING === 'true',
	DISABLE_RATE_LIMIT: process.env.DISABLE_RATE_LIMIT === 'true',

	DATABASE_URL: process.env.DATABASE_URL ?? 'sqlite::memory:',
	// DATABASE_URL_TESTING:
	// 	process.env.DATABASE_URL_TESTING ||
	// 	`sqlite:${__dirname}/../../tmp/testing.db`,
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
	ORM_LOGGING: process.env.ORM_LOGGING === 'true',
	DOTENV_DEBUG: process.env.DOTENV_DEBUG === 'true',

	CORS_ALLOW_ALL: process.env.CORS_ALLOW_ALL === 'true',
	CORS_DEFAULT_ORIGIN: process.env.CORS_DEFAULT_ORIGIN ?? 'meem.wtf',
	CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS
		? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
		: ['clubs.link'],

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
	CHAIN_IDS: process.env.CHAIN_IDS
		? process.env.CHAIN_IDS.split(',').map(cid => +cid.trim())
		: [5],
	NETWORK: process.env.NETWORK
		? (process.env.NETWORK as MeemAPI.NetworkName)
		: ('' as MeemAPI.NetworkName),
	WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY ?? '',
	TWITTER_WALLET_PRIVATE_KEY: process.env.TWITTER_WALLET_PRIVATE_KEY ?? '',
	MEEM_PROXY_ADDRESS: process.env.MEEM_PROXY_ADDRESS ?? '',
	MEEM_ID_PROXY_ADDRESS: process.env.MEEM_ID_PROXY_ADDRESS ?? '',
	TWITTER_PROJECT_TOKEN_ID: process.env.TWITTER_PROJECT_TOKEN_ID ?? '',
	IPFS_CONTENT_GATEWAY_URL:
		process.env.IPFS_CONTENT_GATEWAY_URL ?? 'https://meem.mypinata.cloud',
	GITHUB_KEY: process.env.GITHUB_KEY ?? '',
	ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY ?? '',
	DYNAMODB_SOCKETS_TABLE: process.env.DYNAMODB_SOCKETS_TABLE ?? '',
	DYNAMODB_TWEET_CHECKPOINTS_TABLE:
		process.env.DYNAMODB_TWEET_CHECKPOINTS_TABLE ?? '',
	ENABLE_TEST_ENDPOINTS: process.env.ENABLE_TEST_ENDPOINTS === 'true',
	WEBSOCKETS_ENABLED: process.env.WEBSOCKETS_ENABLED === 'true',
	DISABLE_ASYNC_MINTING: process.env.DISABLE_ASYNC_MINTING === 'true',
	S3_BUCKET: process.env.S3_BUCKET ?? '',
	MAX_GAS_PRICE_GWEI: process.env.MAX_GAS_PRICE_GWEI
		? +process.env.MAX_GAS_PRICE_GWEI
		: 50,
	MIN_GASE_PRICE_GWEI: process.env.MIN_GASE_PRICE_GWEI
		? +process.env.MIN_GASE_PRICE_GWEI
		: 31,
	GAS_ESTIMATE_THRESHOLD_GWEI: process.env.GAS_ESTIMATE_THRESHOLD_GWEI
		? +process.env.GAS_ESTIMATE_THRESHOLD_GWEI
		: 10,
	ENABLE_TWITTER_LISTENERS: process.env.ENABLE_TWITTER_LISTENERS === 'true',
	ENABLE_PROVIDER_LISTENERS: process.env.ENABLE_PROVIDER_LISTENERS === 'true',
	ENABLE_VERBOSE_ERRORS: process.env.ENABLE_VERBOSE_ERRORS === 'true',
	DEFAULT_PAGINATION_LIMIT: process.env.DEFAULT_PAGINATION_LIMIT
		? +process.env.DEFAULT_PAGINATION_LIMIT
		: 20,
	ENABLE_PUPPETEER: process.env.ENABLE_PUPPETEER === 'true',
	MINT_GAS_LIMIT: process.env.MINT_GAS_LIMIT
		? process.env.MINT_GAS_LIMIT
		: '6000000',
	PINATA_API_KEY: process.env.PINATA_API_KEY ?? '',
	PINATA_API_SECRET: process.env.PINATA_API_SECRET ?? '',
	TABLELAND_CONTROLLER_BUNDLE_ID:
		process.env.TABLELAND_CONTROLLER_BUNDLE_ID ?? '',
	MEEM_BUNDLE_ID: process.env.MEEM_BUNDLE_ID ?? '',
	MEEM_PROXY_CONTRACT_ID: process.env.MEEM_PROXY_CONTRACT_ID ?? '',
	ADMIN_ROLE:
		'0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
	MINTER_ROLE:
		'0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
	UPGRADER_ROLE:
		'0x189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3',
	GNOSIS_MASTER_CONTRACT_ADDRESS:
		process.env.GNOSIS_MASTER_CONTRACT_ADDRESS ?? '',
	GNOSIS_PROXY_CONTRACT_ADDRESS:
		process.env.GNOSIS_PROXY_CONTRACT_ADDRESS ?? '',
	GNOSIS_DEFAULT_CALLBACK_HANDLER:
		process.env.GNOSIS_DEFAULT_CALLBACK_HANDLER ?? '',
	DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? '',
	DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ?? '',
	DISCORD_AUTH_CALLBACK_URL: process.env.DISCORD_AUTH_CALLBACK_URL ?? '',
	AUTH0_APP_DOMAIN: process.env.AUTH0_APP_DOMAIN ?? '',
	AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ?? '',
	AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ?? '',
	AUTH0_VERIFY_EMAIL_CALLBACK_URL:
		process.env.AUTH0_VERIFY_EMAIL_CALLBACK_URL ?? '',
	PG_LOCK_RETRY_COUNT: process.env.PG_LOCK_RETRY_COUNT
		? +process.env.PG_LOCK_RETRY_COUNT
		: 10,
	PG_LOCK_TIMEOUT: process.env.PG_LOCK_TIMEOUT
		? +process.env.PG_LOCK_TIMEOUT
		: 60000,
	WALLET_LOCK_KEY: process.env.WALLET_LOCK_KEY ?? 'apiWallet',
	ARBITRUM_GAS_MULTIPLIER: process.env.ARBITRUM_GAS_MULTIPLIER
		? +process.env.ARBITRUM_GAS_MULTIPLIER
		: 6,
	JSON_RPC_MAINNET: process.env.JSON_RPC_MAINNET ?? '',
	JSON_RPC_CELO: process.env.JSON_RPC_CELO ?? 'https://rpc.ankr.com/celo',
	ALCHEMY_API_KEY_MAINNET: process.env.ALCHEMY_API_KEY_MAINNET ?? '',
	ALCHEMY_API_KEY_RINKEBY: process.env.ALCHEMY_API_KEY_RINKEBY ?? '',
	ALCHEMY_API_KEY_POLYGON: process.env.ALCHEMY_API_KEY_POLYGON ?? '',
	ALCHEMY_API_KEY_GOERLI: process.env.ALCHEMY_API_KEY_GOERLI ?? '',
	ALCHEMY_API_KEY_ARBITRUM_GOERLI:
		process.env.ALCHEMY_API_KEY_ARBITRUM_GOERLI ?? '',
	ALCHEMY_API_KEY_OPTIMISM_GOERLI:
		process.env.ALCHEMY_API_KEY_OPTIMISM_GOERLI ?? '',
	ALCHEMY_API_KEY_MUMBAI: process.env.ALCHEMY_API_KEY_MUMBAI ?? '',
	JSON_RPC_HARDHAT: process.env.JSON_RPC_HARDHAT ?? 'http://127.0.0.1:8545',
	PKP_CONTRACT_ADDRESS:
		process.env.PKP_CONTRACT_ADDRESS ??
		'0x86062B7a01B8b2e22619dBE0C15cbe3F7EBd0E92',
	PKP_MINT_COST: process.env.PKP_MINT_COST ?? '0.0001',
	SQS_QUEUE_URL: process.env.SQS_QUEUE_URL ?? '',
	ENABLE_SQS_CONSUMER: process.env.ENABLE_SQS_CONSUMER === 'true',
	GUN_DB_PEERS: process.env.GUN_DB_PEERS ?? '',
	SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY ?? '',
	DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY ?? '',
	DISCORD_APP_ID: process.env.DISCORD_APP_ID ?? '',
	DISCORD_APP_TOKEN: process.env.DISCORD_APP_TOKEN ?? '',
	DISCORD_ENABLE_LISTENERS: process.env.DISCORD_ENABLE_LISTENERS === 'true',
	DISCORD_DEV_SERVER: process.env.DISCORD_DEV_SERVER ?? '',
	DISCORD_BOT_ROLE_NAME: process.env.DISCORD_BOT_ROLE_NAME ?? '',
	TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN ?? '',
	TWITTER_OAUTH_CLIENT_ID: process.env.TWITTER_OAUTH_CLIENT_ID ?? '',
	TWITTER_OAUTH_CLIENT_SECRET: process.env.TWITTER_OAUTH_CLIENT_SECRET ?? '',
	TWITTER_OAUTH_CALLBACK_URL: process.env.TWITTER_OAUTH_CALLBACK_URL ?? '',
	ENCRYPTION_KEY: process.env.ENCRYPTION_KEY
		? (JSON.parse(process.env.ENCRYPTION_KEY) as JsonWebKey)
		: ('' as JsonWebKey),
	TWITTER_AUTH_SCOPES: [
		'tweet.write',
		'tweet.read',
		'users.read',
		'offline.access'
	],
	SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID ?? '',
	SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET ?? '',
	SLACK_SCOPES:
		process.env.SLACK_SCOPES ??
		'channels:join,channels:read,channels:history,im:history,mpim:history,commands,reactions:read,chat:write,chat:write.public,chat:write.customize,emoji:read,team:read',
	SLACK_STATE_SECRET:
		process.env.SLACK_STATE_SECRET ?? 'wfLbmv@sLwzDh!3UprsVLx!vm',
	GA_API_KEY: process.env.GA_API_KEY ?? '',
	GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID ?? '',
	GA_CLIENT_ID:
		process.env.GA_CLIENT_ID ?? 'b8f756de-97f5-4ef1-8bd0-f579f9df7406'
}
