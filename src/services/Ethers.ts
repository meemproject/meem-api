/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
import type { BigNumberish, ethers as Ethers } from 'ethers'
import { chains } from '../lib/chains'
import { ReconnectingWebSocketProvider } from '../lib/ReconnectingWebsocketProvider'

export default class EthersService {
	public static shouldInitialize = true

	private ethers: typeof Ethers

	public constructor() {
		this.ethers = require('ethers').ethers
		this.ethers.utils.Logger.setLogLevel(this.ethers.utils.Logger.levels.ERROR)
	}

	public getInstance() {
		return this.ethers
	}

	public async getProvider(options: { chainId: BigNumberish }) {
		const { ethers } = await import('ethers')

		const chainId = ethers.BigNumber.from(options.chainId)

		let provider: Ethers.providers.Provider
		switch (chainId.toNumber()) {
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
				// provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_RINKEBY)
				provider = new ReconnectingWebSocketProvider(config.WS_RPC_GOERLI, 5)
				break

			case 137:
				// provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_POLYGON)
				provider = new ReconnectingWebSocketProvider(config.WS_RPC_POLYGON, 137)
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

		return provider
	}

	public getSelectors(abi: any[]): string[] {
		const ethers = this.getInstance()

		const functions = abi.filter(a => a.type === 'function')
		const abiInterface = new ethers.utils.Interface(abi)
		const sigHashes: string[] = []
		functions.forEach(f => {
			sigHashes.push(abiInterface.getSighash(ethers.utils.Fragment.from(f)))
		})

		return sigHashes
	}
}
