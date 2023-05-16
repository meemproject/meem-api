import { Readable } from 'stream'
import Pinata, { PinataPinResponse } from '@pinata/sdk'
import type { ethers as Ethers } from 'ethers'
import request from 'superagent'
import { MeemAPI } from '../types/meem.generated'

export default class Web3 {
	public static gweiToWei(gwei: number | Ethers.BigNumber): Ethers.BigNumber {
		const ethers = services.ethers.getInstance()
		return ethers.BigNumber.from(gwei).mul(1000000000)
	}

	public static weiToGwei(gwei: number | Ethers.BigNumber): Ethers.BigNumber {
		const ethers = services.ethers.getInstance()
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

	public static async getGasEstimate(options: { chainId: number }): Promise<{
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
			if (config.TESTING) {
				return {
					recommendedGwei: 1
				}
			}
			const ethers = services.ethers.getInstance()

			const { provider } = await services.ethers.getProvider({
				chainId: options.chainId
			})

			// const lastBlock = await provider.getBlockWithTransactions(blockInfo.block)
			const lastBlock = await provider.core.getBlockWithTransactions('latest')

			let gasPrices: Ethers.BigNumber[] = []

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

			const filteredGasPrices: Ethers.BigNumber[] = []
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

			log.debug({
				avgGwei: this.weiToGwei(avg).toNumber(),
				distribution,
				recommendedGwei: this.weiToGwei(filteredEstimate).toNumber()
			})

			return {
				avgGwei: this.weiToGwei(avg).toNumber(),
				distribution,
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

	public static toBigNumber(val: Ethers.BigNumberish): Ethers.BigNumber {
		const ethers = services.ethers.getInstance()
		const bn = ethers.BigNumber.from(val.toString())
		return bn
	}

	private static getPinataInstance() {
		const pinata = Pinata(config.PINATA_API_KEY, config.PINATA_API_SECRET)
		return pinata
	}

	public static async saveToPinata(options: {
		json?: Record<string, any>
		file?: Readable
	}) {
		const { json, file } = options

		if (!json && !file) {
			throw new Error('MISSING_PARAMETERS')
		}

		const pinata = this.getPinataInstance()

		let response: PinataPinResponse

		if (json) {
			response = await pinata.pinJSONToIPFS(json)
		} else {
			response = await pinata.pinFileToIPFS(file)
		}

		return response
	}
}
