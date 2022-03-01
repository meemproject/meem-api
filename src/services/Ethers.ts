/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
import type { ethers as Ethers } from 'ethers'
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

	public async getProvider(options?: { networkName: MeemAPI.NetworkName }) {
		const { ethers } = await (config.TESTING
			? import('hardhat')
			: import('ethers'))
		const networkName = options?.networkName ?? config.NETWORK
		let provider: Ethers.providers.Provider
		switch (networkName) {
			case MeemAPI.NetworkName.Mainnet:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_MAINNET)
				break

			case MeemAPI.NetworkName.Rinkeby:
				// provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_RINKEBY)
				provider = new ethers.providers.WebSocketProvider(
					config.WS_RPC_RINKEBY,
					'rinkeby'
				)
				break

			case MeemAPI.NetworkName.Polygon:
				// provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_POLYGON)
				provider = new ethers.providers.WebSocketProvider(
					config.WS_RPC_POLYGON,
					137
				)
				break

			case MeemAPI.NetworkName.Hardhat:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_HARDHAT)
				break

			default:
				throw new Error('INVALID_NETWORK')
		}

		return provider
	}
}
