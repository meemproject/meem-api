import { connect } from '@tableland/sdk'
import type { Connection, NetworkName } from '@tableland/sdk'
import { ethers } from 'ethers'
import { MeemAPI } from '../types/meem.generated'

export default class StorageService {
	public static shouldInitialize = true

	private tablelands: {
		[chainId: number]: Connection
	} = {}

	public async createTable(options: {
		chainId: number
		schema: {
			[column: string]: MeemAPI.StorageDataType
		}
	}) {
		const { chainId, schema } = options

		const tableland = await this.getInstance({
			chainId
		})

		let createSchema =
			'id INTEGER PRIMARY KEY, updatedAt INTEGER, createdAt INTEGER'

		Object.keys(schema).forEach(columnName => {
			createSchema += `, ${columnName} ${schema[columnName]}`
		})

		const receipt = await tableland.create(createSchema, {})

		// tableland.setController()

		/**
		 * Receipt
		 * {
		 *   tableId: {
		 *     type: "BigNumber",
		 *     hex: "0x040a"
		 *   },
		 *   prefix: "",
		 *   chainId: 5,
		 *   txnHash: "0x62249c1dc89d2f4c54979f63829576cf9204fd1d107638ccd58f7686c897843b",
		 *   blockNumber: 8081735,
		 *   name: "_5_1034"
		 * }
		 */

		return receipt
	}

	private async getInstance(options: {
		chainId: number
		network?: NetworkName
	}) {
		const { chainId, network } = options
		if (!this.tablelands[chainId]) {
			const { ethersProvider } = await services.ethers.getProvider({ chainId })
			const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY)
			const signer = wallet.connect(ethersProvider)

			const connection = await connect({
				signer,
				network: network ?? 'testnet',
				chain: this.chainIdToTablelandChainName(chainId)
			})
			this.tablelands[chainId] = connection
		}

		return this.tablelands[chainId]
	}

	private chainIdToTablelandChainName(chainId: number) {
		switch (chainId) {
			case 1:
				return 'ethereum'
				break

			case 10:
				return 'optimism'
				break

			case 137:
				return 'polygon'
				break

			case 42161:
				return 'arbitrum'
				break

			case 5:
				return 'ethereum-goerli'
				break

			case 420:
				return 'optimism-goerli'
				break

			case 421613:
				return 'arbitrum-goerli'
				break

			case 80001:
				return 'polygon-mumbai'
				break

			// case 1:
			// 	return 'optimism-goerli-staging'
			// 	break

			// case 1:
			// 	return 'local-tableland'
			// 	break

			// case 1:
			// 	return 'custom'
			// 	break

			default:
				throw new Error('CHAIN_NOT_SUPPORTED')
		}
	}
}
