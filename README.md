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

## Services

Get an ethers instance of the Meem contract:

`services.meem.meemContract()`

