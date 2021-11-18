# Meem API


## Installation / Running API

Create a `.env` file and fill out details (see `.env.example`)

`yarn` - Install packages

`yarn local` - Run API (http://localhost:3005)
## Scripts

### Get latest Meem Contract

`yarn fetchMeemABI` - Fetches the Meem.json ABI file and places it in `src/abis/`

`yarn generateTypes` - Generates typechain types from Meem.json ABI

### Get whitelist

`yarn fetchWhitelist` - Fetches whitelist file and places it in `src/lib/`

### Get access list

`yarn fetchAccess` - Fetches access list file and places it in `src/lib/`

## Services

Get an ethers instance of the Meem contract:

`services.meem.meemContract()`

### Invoke serverless function locally

```
serverless invoke local --function mint --path src/serverless/mock/mint.json \
-e LOG_LEVEL=trace \
-e CORS_ALLOW_ALL=true \
-e ENABLE_REQUEST_LOGGING=true \
-e ALLOW_NON_SSL=true \
-e ORM_DISABLE=true \
-e INFURA_ID= \
-e MEEM_PROXY_ADDRESS= \
-e NETWORK=rinkeby \
-e WALLET_PRIVATE_KEY= \
-e GENERATE_SHARED_TYPES=true \
-e GITHUB_KEY= \
-e AWS_WEBSOCKET_GATEWAY_URL=
```