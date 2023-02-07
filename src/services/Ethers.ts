/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
import { IFacetVersion } from '@meemproject/meem-contracts'
import { Alchemy, Network, Wallet } from 'alchemy-sdk'
import { ethers } from 'ethers'
import { v4 as uuidv4 } from 'uuid'
import { InitParamsStruct } from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import { ICreateTablelandTableInput } from './Queue'

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

	public async queueCreateTablelandTable(options: {
		chainId: number
		tableName: string
		columns: {
			[columnName: string]: MeemAPI.StorageDataType
		}
		agreementExtensionId: string
		abi: Record<string, any>[]
		bytecode: string
		args: any[]
		functionCall: string
		fromVersion: IFacetVersion[]
		toVersion: IFacetVersion[]
	}) {
		const {
			chainId,
			tableName,
			columns,
			agreementExtensionId,
			args,
			abi,
			bytecode,
			functionCall,
			fromVersion,
			toVersion
		} = options

		const txId = uuidv4()

		const transactionInput: ICreateTablelandTableInput = {
			tableName,
			columns,
			agreementExtensionId,
			args,
			bytecode,
			functionCall,
			fromVersion,
			toVersion
		}

		await services.queue.sendMessage({
			Id: txId,
			MessageBody: JSON.stringify({
				id: txId,
				eventName: MeemAPI.QueueEvent.CreateTablelandTable,
				chainId,
				customABI: abi,
				transactionInput
			}),
			MessageGroupId: '1'
		})

		return txId
	}

	public async queueDiamondCut(options: {
		chainId: number
		abi: Record<string, any>[]
		bundleABI: Record<string, any>[]
		fromVersion: IFacetVersion[]
		toVersion: IFacetVersion[]
		contractInitParams: InitParamsStruct
		senderWalletAddress: string
		metadata: MeemAPI.IMeemMetadataLike
		contractTxId?: string
		contractAddress?: string
		parentContractTxtId?: string
	}) {
		const {
			chainId,
			abi,
			bundleABI,
			fromVersion,
			toVersion,
			contractAddress,
			contractTxId,
			contractInitParams,
			metadata,
			senderWalletAddress,
			parentContractTxtId
		} = options

		if (!contractAddress && !contractTxId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const cutTxId = uuidv4()

		await services.queue.sendMessage({
			Id: cutTxId,
			MessageBody: JSON.stringify({
				id: cutTxId,
				eventName: MeemAPI.QueueEvent.DiamondCut,
				chainId,
				customABI: abi,
				transactionInput: {
					bundleABI,
					fromVersion,
					toVersion,
					contractTxId,
					contractAddress,
					contractInitParams,
					metadata,
					senderWalletAddress,
					parentContractTxtId
				}
			}),
			MessageGroupId: '1'
		})

		return cutTxId
	}

	public async queueContractDeployment(options: {
		chainId: number
		abi: Record<string, any>[]
		bytecode: string
		args: any[]
	}) {
		const { chainId, abi, bytecode, args } = options

		const txId = uuidv4()

		await services.queue.sendMessage({
			Id: txId,
			MessageBody: JSON.stringify({
				id: txId,
				eventName: MeemAPI.QueueEvent.DeployContract,
				chainId,
				customABI: abi,
				transactionInput: {
					args,
					bytecode
				}
			}),
			MessageGroupId: '1'
		})

		return txId
	}

	public async queueTransaction(options: {
		abi?: Record<string, any>[]
		functionSignature: string
		contractTxId?: string
		contractAddress?: string
		inputValues: Record<string, any>
		chainId: number
		eventName?: MeemAPI.QueueEvent
		/** Necessary when QueueEvent == DeploySafe */
		agreementId?: string
	}) {
		const {
			abi,
			functionSignature,
			contractAddress,
			contractTxId,
			inputValues,
			chainId,
			eventName,
			agreementId
		} = options

		if (!contractAddress && !contractTxId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const id = uuidv4()

		await services.queue.sendMessage({
			Id: id,
			MessageBody: JSON.stringify({
				id,
				eventName: eventName ?? MeemAPI.QueueEvent.CallContract,
				agreementId,
				chainId,
				customABI: abi,
				transactionInput: {
					contractAddress,
					contractTxId,
					functionSignature,
					inputValues
				}
			}),
			MessageGroupId: '1'
		})

		return id
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

			const { wallet, provider } = await services.ethers.getProvider({
				chainId
			})

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

	public async aquireLockAndNonce(chainId: number) {
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

		const { wallet, provider } = await services.ethers.getProvider({
			chainId
		})

		const providerTxCount = await provider.core.getTransactionCount(
			wallet.address,
			'latest'
		)

		const providerNonce = providerTxCount - 1

		if (providerNonce > nonce) {
			nonce = providerNonce
		}

		const newNonce = providerTxCount > 0 ? nonce + 1 : 0

		return { nonce: newNonce }
	}

	public async releaseLockAndNonce(options: {
		chainId: number
		nonce: number
	}) {
		const { chainId, nonce } = options
		const chainNonce = await orm.models.ChainNonce.findOne({
			where: {
				chainId
			}
		})

		const promises: Promise<any>[] = []

		if (!chainNonce) {
			promises.push(
				orm.models.ChainNonce.create({
					chainId,
					nonce
				})
			)
		} else {
			chainNonce.nonce = nonce
			promises.push(chainNonce.save())
		}

		promises.push(this.releaseLock(chainId))
		await Promise.all(promises)
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
}
