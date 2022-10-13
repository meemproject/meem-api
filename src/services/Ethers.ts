/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
import { ethers } from 'ethers'
import { chains } from '../lib/chains'
import { ReconnectingWebSocketProvider } from '../lib/ReconnectingWebsocketProvider'

export default class EthersService {
	public static shouldInitialize = true

	private providers: Record<number, ethers.providers.Provider> = {}

	private ethers: typeof ethers

	public constructor() {
		this.ethers = require('ethers').ethers
		this.ethers.utils.Logger.setLogLevel(this.ethers.utils.Logger.levels.ERROR)
	}

	public getInstance() {
		return this.ethers
	}

	public async getProvider(options: { chainId: ethers.BigNumberish }) {
		const chainId = ethers.BigNumber.from(options.chainId)
		const chainIdNum = chainId.toNumber()

		let provider: ethers.providers.Provider

		if (this.providers[chainIdNum]) {
			return this.providers[chainIdNum]
		}

		switch (chainIdNum) {
			case 1:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_MAINNET)
				break

			case 4:
				// provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_RINKEBY)
				provider = new ReconnectingWebSocketProvider(
					config.WS_RPC_RINKEBY,
					'rinkeby'
				)
				break

			case 5:
				provider = new ReconnectingWebSocketProvider(config.WS_RPC_GOERLI, 5)
				break

			case 137:
				provider = new ReconnectingWebSocketProvider(config.WS_RPC_POLYGON, 137)
				break

			case 80001:
				provider = new ReconnectingWebSocketProvider(
					config.WS_RPC_MUMBAI,
					80001
				)
				break

			case 421613:
				provider = new ReconnectingWebSocketProvider(
					config.WS_RPC_ARBITRUM_GOERLI,
					421613
				)
				break

			case 420:
				provider = new ReconnectingWebSocketProvider(
					config.WS_RPC_OPTIMISM_GOERLI,
					420
				)
				break

			case 31337:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_HARDHAT)
				break

			default: {
				const chain = chains.find(c => c.chainId === options?.chainId)

				if (!chain) {
					throw new Error('INVALID_NETWORK')
				}
				const wsRPCUrl = chain.rpc.find(r => /^wss/.test(r))
				if (wsRPCUrl) {
					provider = new ReconnectingWebSocketProvider(wsRPCUrl, chain.chainId)
				} else {
					provider = new ethers.providers.JsonRpcProvider(
						chain.rpc[0],
						chain.chainId
					)
				}
			}
		}

		this.providers[chainIdNum] = provider

		return provider
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

	public async acquireLock(chainId: number) {
		try {
			await orm.acquireLock(`${config.WALLET_LOCK_KEY}_${chainId}`)
		} catch (e) {
			log.warn(e)
		}
	}

	public async releaseLock(chainId: number) {
		try {
			await orm.releaseLock(`${config.WALLET_LOCK_KEY}_${chainId}`)
		} catch (e) {
			log.warn(e)
		}
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

			const provider = await this.getProvider({ chainId })
			const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

			const providerTxCount = await provider.getTransactionCount(wallet.address)

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
				overrides.gasLimit = gasLimit
			}

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
}
