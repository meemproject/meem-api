/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
import { Alchemy, Network, Wallet } from 'alchemy-sdk'
import { ethers } from 'ethers'

export default class EthersService {
	public static shouldInitialize = true

	// private providers: Record<number, ethers.providers.Provider> = {}
	private providers: Record<number, { provider: Alchemy; wallet: Wallet }> = {}

	private ethers: typeof ethers

	public constructor() {
		this.ethers = require('ethers').ethers
		this.ethers.utils.Logger.setLogLevel(this.ethers.utils.Logger.levels.ERROR)
	}

	public getInstance() {
		return this.ethers
	}

	public async lookupAddress(address: string) {
		try {
			const provider = new ethers.providers.JsonRpcProvider(
				config.JSON_RPC_MAINNET
			)

			const resolvedAddress = await provider.lookupAddress(address)

			return resolvedAddress
		} catch (e) {
			log.debug(e)
		}

		return null
	}

	public async getProvider(options: { chainId: ethers.BigNumberish }) {
		const chainId = ethers.BigNumber.from(options.chainId)
		const chainIdNum = chainId.toNumber()

		// if (this.providers[chainIdNum]) {
		// 	return this.providers[chainIdNum]
		// }

		let alchemyProvider: Alchemy
		let provider: ethers.providers.JsonRpcProvider | undefined

		switch (chainIdNum) {
			case 1: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_MAINNET
				})

				provider = new ethers.providers.JsonRpcProvider(
					`https://eth-mainnet.g.alchemy.com/v2/${config.ALCHEMY_API_KEY_MAINNET}`
				)
				break
			}

			case 5: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_GOERLI,
					network: Network.ETH_GOERLI
				})

				provider = new ethers.providers.JsonRpcProvider(
					`https://eth-goerli.g.alchemy.com/v2/${config.ALCHEMY_API_KEY_GOERLI}`
				)
				break
			}

			case 137: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_POLYGON,
					network: Network.MATIC_MAINNET
				})

				provider = new ethers.providers.JsonRpcProvider(
					`https://polygon-mainnet.g.alchemy.com/v2/${config.ALCHEMY_API_KEY_POLYGON}`
				)
				break
			}

			case 80001: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_MUMBAI,
					network: Network.MATIC_MUMBAI
				})

				provider = new ethers.providers.JsonRpcProvider(
					`https://polygon-mumbai.g.alchemy.com/v2/${config.ALCHEMY_API_KEY_MUMBAI}`
				)
				break
			}

			case 421613: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_ARBITRUM_GOERLI,
					network: Network.ARB_GOERLI
				})

				provider = new ethers.providers.JsonRpcProvider(
					`https://arb-goerli.g.alchemy.com/v2/${config.ALCHEMY_API_KEY_ARBITRUM_GOERLI}`
				)
				break
			}

			case 42220: {
				alchemyProvider = new Alchemy({
					url: config.JSON_RPC_CELO
				})

				provider = new ethers.providers.JsonRpcProvider(`??`)
				break
			}

			case 420: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_OPTIMISM_GOERLI,
					network: Network.OPT_GOERLI
				})

				provider = new ethers.providers.JsonRpcProvider(
					`https://opt-goerli.g.alchemy.com/v2/${config.ALCHEMY_API_KEY_GOERLI}`
				)
				break
			}

			case 31337:
				alchemyProvider = new Alchemy({ url: config.JSON_RPC_HARDHAT })

				provider = new ethers.providers.JsonRpcProvider(`http://localhost:8545`)
				break

			default: {
				// const chain = chains.find(c => c.chainId === options?.chainId)

				// if (!chain) {
				// 	throw new Error('INVALID_NETWORK')
				// }
				// const wsRPCUrl = chain.rpc.find(r => /^wss/.test(r))
				// if (wsRPCUrl) {
				// 	provider = new ReconnectingWebSocketProvider(wsRPCUrl, chain.chainId)
				// } else {
				// 	provider = new ethers.providers.JsonRpcProvider(
				// 		chain.rpc[0],
				// 		chain.chainId
				// 	)
				// }
				throw new Error('INVALID_NETWORK')
			}
		}

		// this.providers[chainIdNum] = provider
		const wallet = new Wallet(config.WALLET_PRIVATE_KEY, alchemyProvider)

		this.providers[chainIdNum] = { provider: alchemyProvider, wallet }

		return { provider: alchemyProvider, wallet, ethersProvider: provider }
	}

	public getSelectors(abi: any[]): string[] {
		const ethersInstance = this.getInstance()

		const functions = abi.filter(a => a.type === 'function')
		const abiInterface = new ethersInstance.utils.Interface(abi)
		const sigHashes: string[] = []
		functions.forEach(f => {
			sigHashes.push(
				abiInterface.getSighash(ethersInstance.utils.Fragment.from(f))
			)
		})

		return sigHashes
	}
}
