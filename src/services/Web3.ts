import { Readable } from 'stream'
import Pinata, { PinataPinResponse } from '@pinata/sdk'
import BigNumber from 'bignumber.js'
import type { ethers as Ethers } from 'ethers'
import Moralis from 'moralis/node'
import request from 'superagent'
import { v4 as uuidv4, validate as validateUUID } from 'uuid'
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

	public static async getGasEstimate(options?: { chainId?: string }): Promise<{
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

			const provider = await services.ethers.getProvider({
				chainId: options?.chainId
			})

			// const lastBlock = await provider.getBlockWithTransactions(blockInfo.block)
			const lastBlock = await provider.getBlockWithTransactions('latest')

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

	public static async getNFTs(options: {
		address: string
		chains?: MeemAPI.Chain[]
		offset?: number
		limit?: number
	}): Promise<MeemAPI.IChainNFTsResult[]> {
		if (config.TESTING) {
			return services.testing.getNFTs()
		}
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

	public static toBigNumber(
		val: BigNumber.Value | Ethers.BigNumberish
	): Ethers.BigNumber {
		const ethers = services.ethers.getInstance()
		const bn = new BigNumber(val.toString() as BigNumber.Value)
		let bigStr = bn.toString(16)
		let isNegative = false
		if (/^-/.test(bigStr)) {
			bigStr = bigStr.substr(1)
			isNegative = true
		}
		const ebn = ethers.BigNumber.from(`${isNegative ? '-' : ''}0x${bigStr}`)

		return ebn
	}

	private static async startMoralis() {
		await Moralis.Web3API.initialize({
			apiKey: config.MORALIS_API_KEY
		})
	}

	private static getPinataInstance() {
		const pinata = Pinata(config.PINATA_API_KEY, config.PINATA_API_SECRET)
		return pinata
	}

	private static chainToMoralis(chain: MeemAPI.Chain): MoralisChainList {
		switch (+chain) {
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

	public static async saveMeemMetadata(data: {
		imageBase64?: string
		image?: Buffer
		metadata: MeemAPI.IMeemMetadata | MeemAPI.ICreateMeemMetadata
	}): Promise<{ metadata: MeemAPI.IMeemMetadata; tokenURI: string }> {
		if (config.TESTING) {
			const imageURI = services.testing.getIpfsUrl()
			return {
				metadata: services.testing.getMeemMetadata({
					image: imageURI,
					image_original: imageURI
				}),
				tokenURI: services.testing.getIpfsUrl()
			}
		}

		this.validateCreateMeemMetadata(data.metadata)

		const imgData = data.imageBase64 ?? data.image?.toString('base64')

		if (!imgData) {
			throw new Error('INVALID_IMAGE_TYPE')
		}

		const meemMetadata = data.metadata as MeemAPI.IMeemMetadata

		const meemId = data.metadata.meem_id ?? uuidv4()
		const isValid = validateUUID(meemId)

		if (!isValid) {
			throw new Error('INVALID_METADATA')
		}

		// const buffStream = new stream.PassThrough()
		// buffStream.end(Buffer.from(imgData, 'base64'))
		const buff = Buffer.from(imgData, 'base64')
		const stream = Readable.from(buff)
		// @ts-ignore
		stream.path = `${meemId}/image.png`

		const imageResponse = await this.saveToPinata({
			// file: Readable.from(Buffer.from(imgData, 'base64'))
			// file: buffStream
			file: stream
		})

		// const imageResponse = await this.saveToMoralis({
		// 	// path: `${meemId}/image.png`,
		// 	// content: imgData
		// })

		// const image: string =
		// 	_.isArray(imageResponse.body) && imageResponse.body.length > 0
		// 		? this.moralisPathToIPFSPath(imageResponse.body[0].path)
		// 		: ''

		const image = `ipfs://${imageResponse.IpfsHash}`

		const externalUrl =
			meemMetadata.external_url ?? `${config.MEEM_DOMAIN}/meems/${meemId}`

		const storedMetadata: MeemAPI.IMeemMetadata = {
			...data.metadata,
			external_url: externalUrl,
			meem_id: meemId,
			image,
			image_original:
				meemMetadata.image && meemMetadata.image !== ''
					? meemMetadata.image
					: image
		}

		// const jsonString = JSON.stringify(storedMetadata)
		// const jsonBase64 = Buffer.from(jsonString).toString('base64')

		// const metadataResponse = await this.saveToMoralis({
		// 	path: `${meemId}/metadata.json`,
		// 	content: jsonBase64
		// })

		// const metadataPath: string =
		// 	_.isArray(metadataResponse.body) && metadataResponse.body.length > 0
		// 		? this.moralisPathToIPFSPath(metadataResponse.body[0].path)
		// 		: ''

		const metadataResponse = await this.saveToPinata({
			json: storedMetadata
		})

		// return {
		// 	metadata: storedMetadata,
		// 	tokenURI: metadataPath
		// }
		return {
			metadata: storedMetadata,
			tokenURI: `ipfs://${metadataResponse.IpfsHash}`
		}
	}

	public static validateCreateMeemMetadata(metadata: Record<string, any>) {
		if (!metadata.name || !metadata.description) {
			throw new Error('INVALID_METADATA')
		}
	}

	public static async syncPins() {
		const meems = await orm.models.Meem.findAll({ limit: 5 })
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

	private static async saveToMoralis(options: {
		path: string
		content: string
	}) {
		const { path, content } = options
		await this.startMoralis()

		const response = await request
			.post('https://deep-index.moralis.io/api/v2/ipfs/uploadFolder')
			.set('X-API-KEY', config.MORALIS_API_KEY)
			.send([
				{
					path,
					content
				}
			])

		return response
	}

	private static async saveToPinata(options: {
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

	private static moralisPathToIPFSPath(path: string): string {
		const ipfsPath = path.replace(/.*\/ipfs\//, '')
		return `ipfs://${ipfsPath}`
	}
}
