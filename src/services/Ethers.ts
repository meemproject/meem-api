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

		if (this.providers[chainIdNum]) {
			return this.providers[chainIdNum]
		}

		let alchemyProvider: Alchemy

		switch (chainIdNum) {
			case 1: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_MAINNET
				})
				break
			}

			case 5: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_GOERLI,
					network: Network.ETH_GOERLI
				})
				break
			}

			case 137: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_POLYGON,
					network: Network.MATIC_MAINNET
				})
				break
			}

			case 80001: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_MUMBAI,
					network: Network.MATIC_MUMBAI
				})
				break
			}

			case 421613: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_ARBITRUM_GOERLI,
					network: Network.ARB_GOERLI
				})
				break
			}

			case 42220: {
				alchemyProvider = new Alchemy({
					url: config.JSON_RPC_CELO
				})
				break
			}

			case 420: {
				alchemyProvider = new Alchemy({
					apiKey: config.ALCHEMY_API_KEY_OPTIMISM_GOERLI,
					network: Network.OPT_GOERLI
				})
				break
			}

			case 31337:
				alchemyProvider = new Alchemy({ url: config.JSON_RPC_HARDHAT })
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

		return { provider: alchemyProvider, wallet }
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

	public async runTransaction<T extends (...args: any[]) => any>(options: {
		/** The chain */
		chainId: number
		/** The function to run */
		fn: T
		/** The function parameters */
		params: Parameters<T>

		/** Explicitly set the gas limit */
		gasLimit?: ethers.BigNumberish | Promise<ethers.BigNumberish> | undefined
	}): Promise<ReturnType<T>> {
		const { chainId, fn, params, gasLimit } = options
		try {
			await this.acquireLock(chainId)
			let nonce = 0
			let chainNonce = await orm.models.ChainNonce.findOne({
				where: {
					chainId
				}
			})

			if (chainNonce) {
				nonce = chainNonce.nonce
			} else {
				chainNonce = orm.models.ChainNonce.build({
					nonce,
					chainId
				})
			}

			const { provider } = await this.getProvider({ chainId })
			const wallet = new Wallet(config.WALLET_PRIVATE_KEY, provider)

			const providerTxCount = await provider.core.getTransactionCount(
				wallet.address,
				'latest'
			)

			const providerNonce = providerTxCount - 1

			if (providerNonce > nonce) {
				nonce = providerNonce
			}

			const newNonce = providerTxCount > 0 ? nonce + 1 : 0

			let { recommendedGwei } = await services.web3.getGasEstimate({
				chainId
			})

			if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
				// throw new Error('GAS_PRICE_TOO_HIGH')
				log.warn(`Recommended fee over max: ${recommendedGwei}`)
				recommendedGwei = config.MAX_GAS_PRICE_GWEI
			}

			const overrides: ethers.Overrides = {
				nonce: newNonce,
				gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
			}

			if (gasLimit) {
				overrides.gasLimit =
					chainId === 421613
						? ethers.BigNumber.from(gasLimit).mul(
								config.ARBITRUM_GAS_MULTIPLIER
						  )
						: gasLimit
			} else if (chainId === 421613) {
				// Add additional gas for arbitrum
				overrides.gasLimit = ethers.BigNumber.from(config.MINT_GAS_LIMIT).mul(
					config.ARBITRUM_GAS_MULTIPLIER
				)
			}

			log.debug(overrides)

			const result = await fn(...params, overrides)

			chainNonce.nonce = newNonce
			await chainNonce.save()

			await this.releaseLock(chainId)

			return result
		} catch (e) {
			await this.releaseLock(chainId)
			throw e
		}
	}

	private async acquireLock(chainId: number) {
		try {
			await orm.acquireLock(`${config.WALLET_LOCK_KEY}_${chainId}`)
		} catch (e) {
			log.warn(e)
		}
	}

	private async releaseLock(chainId: number) {
		try {
			await orm.releaseLock(`${config.WALLET_LOCK_KEY}_${chainId}`)
		} catch (e) {
			log.warn(e)
		}
	}
}
