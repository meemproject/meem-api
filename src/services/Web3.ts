import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { DateTime } from 'luxon'
import Moralis from 'moralis/node'
import request from 'superagent'
import { MeemAPI } from '../types/meem.generated'
import { AsyncReturnType } from '../types/shared/api.shared'

type MoralisChainList =
	| 'eth'
	| '0x1'
	| 'ropsten'
	| '0x3'
	| 'rinkeby'
	| '0x4'
	| 'goerli'
	| '0x5'
	| 'kovan'
	| '0x2a'
	| 'polygon'
	| '0x89'
	| 'mumbai'
	| '0x13881'
	| 'bsc'
	| '0x38'
	| 'bsc testnet'
	| '0x61'
	| 'avalanche'
	| '0xa86a'
	| 'fantom'
	| '0xfa'

export default class Web3 {
	public static gweiToWei(gwei: number | ethers.BigNumber): ethers.BigNumber {
		return ethers.BigNumber.from(gwei).mul(1000000000)
	}

	public static weiToGwei(gwei: number | ethers.BigNumber): ethers.BigNumber {
		return ethers.BigNumber.from(gwei).div(1000000000)
	}

	public static async getOracleGasEstimate(chain: MeemAPI.NetworkName) {
		const result = {
			standard: 31,
			fast: 31,
			rapid: 31
		}

		switch (chain) {
			case MeemAPI.NetworkName.Polygon: {
				try {
					const { body } = await request.get(
						'https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=pendingpooltxgweidata'
					)
					if (body.result.standardgaspricegwei) {
						result.standard = body.result.standardgaspricegwei
					}
					if (body.result.fastgaspricegwei) {
						result.fast = body.result.fastgaspricegwei
					}
					if (body.result.rapidgaspricegwei) {
						result.rapid = body.result.rapidgaspricegwei
					}
				} catch (e) {
					log.warn(e)
				}
				break
			}

			default:
				log.debug(`Gas estimate not implemented for Chain: ${chain}`)
				break
		}

		return result
	}

	public static async getGasEstimate(options?: {
		chain?: MeemAPI.Chain
	}): Promise<{
		avgGwei?: number
		distribution?: Record<number, number>
		blockInfo?: {
			date: number
			block: number
			timestamp: number
		}
		recommendedGwei: number
	}> {
		try {
			const chain = options?.chain ?? MeemAPI.Chain.Polygon

			if (chain === MeemAPI.Chain.Rinkeby) {
				return {
					recommendedGwei: 2
				}
			}

			await this.startMoralis()

			const blockInfo = await Moralis.Web3API.native.getDateToBlock({
				chain: this.chainToMoralis(chain),
				date: DateTime.now().toString()
			})

			const provider = services.meem.getProvider({
				networkName: MeemAPI.chainToNetworkName(chain)
			})

			const lastBlock = await provider.getBlockWithTransactions(blockInfo.block)

			let gasPrices: ethers.BigNumber[] = []

			lastBlock.transactions.forEach(t => {
				if (t.gasPrice) {
					gasPrices.push(t.gasPrice)
				}
			})

			gasPrices = gasPrices.sort((a, b) => {
				return a.sub(b).toNumber()
			})

			let total = ethers.BigNumber.from(0)

			gasPrices.forEach(p => {
				total = total.add(p)
			})

			const filteredGasPrices: ethers.BigNumber[] = []
			const minimumWei = this.gweiToWei(config.MIN_GASE_PRICE_GWEI).toNumber()
			let filteredEstimate = ethers.BigNumber.from(minimumWei)
			const thresholdWei = this.gweiToWei(
				config.GAS_ESTIMATE_THRESHOLD_GWEI
			).toNumber()

			const distribution: Record<number, number> = {}

			gasPrices.forEach(gp => {
				const gwei = this.weiToGwei(gp).toNumber()

				if (!distribution[gwei]) {
					distribution[gwei] = 1
				} else {
					distribution[gwei] += 1
				}

				if (
					gp.toNumber() >= minimumWei &&
					(filteredGasPrices.length === 0 ||
						gp.toNumber() <
							filteredGasPrices[filteredGasPrices.length - 1].toNumber() +
								thresholdWei)
				) {
					filteredGasPrices.push(gp)
					let currentTotal = ethers.BigNumber.from(0)

					filteredGasPrices.forEach(p => {
						currentTotal = currentTotal.add(p)
					})
					filteredEstimate = currentTotal.div(filteredGasPrices.length)
				}
			})

			const avg = total.div(gasPrices.length)

			return {
				avgGwei: this.weiToGwei(avg).toNumber(),
				distribution,
				blockInfo,
				recommendedGwei: this.weiToGwei(filteredEstimate).toNumber()
			}
		} catch (e) {
			log.warn(e)
			// Return defaults
			return {
				recommendedGwei: config.MIN_GASE_PRICE_GWEI
			}
		}
	}

	public static async getNFTs(options: {
		address: string
		chains?: MeemAPI.Chain[]
		offset?: number
		limit?: number
	}): Promise<MeemAPI.IChainNFTsResult[]> {
		const { address, offset, limit } = options

		const chains = options.chains ?? [
			MeemAPI.Chain.Ethereum,
			MeemAPI.Chain.Polygon
		]

		await this.startMoralis()

		const promises = chains.map(chain =>
			Moralis.Web3API.account.getNFTs({
				chain: this.chainToMoralis(chain),
				address,
				offset,
				limit
			})
		)

		const nftResults = await Promise.all(promises)

		const result: MeemAPI.IChainNFTsResult[] = []

		chains.forEach((chain, i) => {
			result.push({
				chain,
				total: nftResults[i].total ?? 0,
				page: nftResults[i].page ?? 0,
				pageSize: nftResults[i].page_size ?? 0,
				nfts: this.normalizeMoralisNFTs(nftResults[i])
			})
		})

		return result
	}

	private static async startMoralis() {
		await Moralis.Web3API.initialize({
			apiKey: config.MORALIS_API_KEY
		})
	}

	private static chainToMoralis(chain: MeemAPI.Chain): MoralisChainList {
		switch (chain) {
			case MeemAPI.Chain.Rinkeby:
				return 'rinkeby'

			case MeemAPI.Chain.Polygon:
				return 'polygon'

			default:
			case MeemAPI.Chain.Ethereum:
				return 'eth'
		}
	}

	private static normalizeMoralisNFTs(
		nfts: AsyncReturnType<typeof Moralis.Web3API.account.getNFTs>
	): MeemAPI.INFT[] {
		return (
			nfts.result?.map(n => ({
				metadata: n.metadata,
				tokenAddress: n.token_address,
				tokenId: n.token_id,
				contractType: n.contract_type,
				ownerOf: n.owner_of,
				blockNumber: n.block_number,
				blockNumberMinted: n.block_number_minted,
				tokenUri: n.token_uri,
				syncedAt: n.synced_at,
				amount: n.amount,
				name: n.name,
				symbol: n.symbol
			})) ?? []
		)
	}
}