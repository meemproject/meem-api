/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
import type { ethers as Ethers } from 'ethers'
import { chains } from '../lib/chains'
import { ReconnectingWebSocketProvider } from '../lib/ReconnectingWebsocketProvider'
import { MeemAPI } from '../types/meem.generated'

export default class EthersService {
	public static shouldInitialize = true

	private ethers: typeof Ethers

	public constructor() {
		if (config.TESTING) {
			this.ethers = require('hardhat').ethers
		} else {
			this.ethers = require('ethers').ethers
		}
		this.ethers.utils.Logger.setLogLevel(this.ethers.utils.Logger.levels.ERROR)
	}

	public getInstance() {
		return this.ethers
	}

	public async getProvider(options?: { chainId?: number }) {
		const { ethers } = await (config.TESTING
			? import('hardhat')
			: import('ethers'))

		const chainId = options?.chainId ?? config.CHAIN_ID

		let provider: Ethers.providers.Provider
		switch (chainId) {
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
}
