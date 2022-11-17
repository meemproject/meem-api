import { Readable } from 'stream'
import Pinata, { PinataPinResponse } from '@pinata/sdk'
// import BigNumber from 'bignumber.js'
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
		// let bigStr = bn.toString()
		// let isNegative = false
		// if (/^-/.test(bigStr)) {
		// 	bigStr = bigStr.substr(1)
		// 	isNegative = true
		// }
		// const ebn = ethers.BigNumber.from(
		// 	`${isNegative ? '-' : ''}0x${bn.toHexString()}`
		// )

		// return ebn
		return bn
	}

	private static getPinataInstance() {
		const pinata = Pinata(config.PINATA_API_KEY, config.PINATA_API_SECRET)
		return pinata
	}

	// public static async saveMeemMetadata(data: {
	// 	imageBase64?: string
	// 	image?: Buffer
	// 	metadata: MeemAPI.IMeemMetadataLike | MeemAPI.ICreateMeemMetadata
	// }): Promise<{ metadata: MeemAPI.IMeemMetadataLike; tokenURI: string }> {
	// 	if (config.TESTING) {
	// 		const imageURI = services.testing.getIpfsUrl()
	// 		return {
	// 			metadata: services.testing.getMeemMetadata({
	// 				image: imageURI,
	// 				image_original: imageURI
	// 			}),
	// 			tokenURI: services.testing.getIpfsUrl()
	// 		}
	// 	}

	// 	this.validateCreateMeemMetadata(data.metadata)

	// 	const imgData = data.imageBase64 ?? data.image?.toString('base64')

	// 	if (!imgData) {
	// 		throw new Error('INVALID_IMAGE_TYPE')
	// 	}

	// 	const meemMetadata = data.metadata as MeemAPI.IMeemMetadataLike

	// 	const meemId = data.metadata.meem_id ?? uuidv4()
	// 	const isValid = validateUUID(meemId)

	// 	if (!isValid) {
	// 		throw new Error('INVALID_METADATA')
	// 	}

	// 	// const buffStream = new stream.PassThrough()
	// 	// buffStream.end(Buffer.from(imgData, 'base64'))
	// 	const buff = Buffer.from(imgData, 'base64')
	// 	const stream = Readable.from(buff)
	// 	// @ts-ignore
	// 	stream.path = `${meemId}/image.png`

	// 	const imageResponse = await this.saveToPinata({
	// 		// file: Readable.from(Buffer.from(imgData, 'base64'))
	// 		// file: buffStream
	// 		file: stream
	// 	})

	// 	const image = `ipfs://${imageResponse.IpfsHash}`

	// 	const externalUrl =
	// 		meemMetadata.external_url ?? `${config.MEEM_DOMAIN}/meems/${meemId}`

	// 	const storedMetadata: MeemAPI.IMeemMetadataLike = {
	// 		...data.metadata,
	// 		external_url: externalUrl,
	// 		meem_id: meemId,
	// 		image,
	// 		image_original:
	// 			meemMetadata.image && meemMetadata.image !== ''
	// 				? meemMetadata.image
	// 				: image
	// 	}

	// 	const metadataResponse = await this.saveToPinata({
	// 		json: storedMetadata
	// 	})

	// 	// return {
	// 	// 	metadata: storedMetadata,
	// 	// 	tokenURI: metadataPath
	// 	// }
	// 	return {
	// 		metadata: storedMetadata,
	// 		tokenURI: `ipfs://${metadataResponse.IpfsHash}`
	// 	}
	// }

	// public static validateCreateMeemMetadata(metadata: Record<string, any>) {
	// 	if (!metadata.name || !metadata.description) {
	// 		throw new Error('INVALID_METADATA')
	// 	}
	// }

	public static async syncPins() {
		const meems = await orm.models.AgreementToken.findAll({ limit: 5 })
		const pinata = this.getPinataInstance()

		for (let i = 0; i < meems.length; i += 1) {
			const meem = meems[i]
			const matches = meem.tokenURI.match(/ipfs:\/\/([^/]*)/)
			if (matches && matches[1]) {
				const ipfsHash = matches[1]
				log.debug(`Pinning metadata w/ hash: ${ipfsHash}`)
				// eslint-disable-next-line no-await-in-loop
				await pinata.pinByHash(ipfsHash)
			} else {
				log.debug(`Skipping ${meem.tokenURI}`)
			}

			const imgMatches = meem.metadata.image.match(/ipfs:\/\/([^/]*)/)
			if (imgMatches && imgMatches[1]) {
				const ipfsHash = imgMatches[1]
				log.debug(`Pinning image w/ hash: ${ipfsHash}`)
				// eslint-disable-next-line no-await-in-loop
				await pinata.pinByHash(ipfsHash)
			} else {
				log.debug(`Skipping ${meem.metadata.image}`)
			}
		}
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
