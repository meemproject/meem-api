import * as path from 'path'
import { ethers as Ethers } from 'ethers'
import _ from 'lodash'
import sharp from 'sharp'
import request from 'superagent'
import ERC721ABI from '../abis/ERC721.json'
import meemABI from '../abis/Meem.json'
import meemAccessListTesting from '../lib/meem-access-testing.json'
import meemAccessList from '../lib/meem-access.json'
import { ERC721 } from '../types/ERC721'
import { Mycontract } from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
export default class MeemService {
	/** Get generic ERC721 contract instance */
	public static async erc721Contract(options: {
		networkName?: MeemAPI.NetworkName
		address: string
	}) {
		const ethers = services.ethers.getInstance()
		const { networkName, address } = options
		const { wallet } = await services.ethers.getProvider({
			chainId: MeemAPI.networkNameToChain(
				networkName ?? MeemAPI.NetworkName.Mainnet
			)
		})

		const contract = new ethers.Contract(address, ERC721ABI, wallet) as ERC721

		return contract
	}

	public static async getErc721Metadata(uri: string) {
		let metadata: MeemAPI.IERC721Metadata
		if (uri.length === 0 || uri === 'ipfs://example') {
			return {}
		}
		if (/^data:application\/json/.test(uri)) {
			const json = Buffer.from(uri.substring(29), 'base64').toString()
			metadata = JSON.parse(json)
		} else if (/^{/.test(uri)) {
			metadata = JSON.parse(uri)
		} else if (/^ipfs/.test(uri)) {
			const result = await services.ipfs.getIPFSFile(uri)
			if (result.type !== 'application/json') {
				throw new Error('INVALID_METADATA')
			}
			metadata = result.body
		} else {
			const result = await request.get(uri)
			if (result.type === 'application/json') {
				metadata = result.body
			} else if (result.type === 'text/plain') {
				metadata = JSON.parse(result.text)
			} else {
				throw new Error('INVALID_METADATA')
			}
		}

		return metadata
	}

	public static async getImageFromMetadata(metadata: MeemAPI.IERC721Metadata) {
		if (!metadata.image) {
			throw new Error('INVALID_METADATA')
		}

		let image

		if (/^ipfs/.test(metadata.image)) {
			const result = await services.ipfs.getIPFSFile(metadata.image)
			if (!/image/.test(result.type)) {
				throw new Error('INVALID_IMAGE_TYPE')
			}
			image = Buffer.from(result.body)
		} else if (/^data:image/.test(metadata.image)) {
			const dataIndex = metadata.image.indexOf('base64,')
			image = Buffer.from(metadata.image.substring(dataIndex + 7), 'base64')
		} else {
			const { body } = await request.get(metadata.image)
			image = Buffer.from(body)
		}

		return image
	}

	/** Get a Meem contract instance */
	public static async getAgreement(options: {
		address: string
		chainId: number
		walletPrivateKey?: string
	}) {
		const { chainId, address } = options

		const ethers = services.ethers.getInstance()

		if (config.TESTING) {
			// @ts-ignore
			const c = (await ethers.getContractAt(meemABI, address))
				// @ts-ignore
				.connect(global.signer)
			// const c = await ethers.getContractAt(meemABI, address)
			return c as Mycontract
		}

		const { wallet } = await services.ethers.getProvider({
			chainId
		})

		const agreement = new ethers.Contract(
			address,
			meemABI,
			wallet
		) as unknown as Mycontract

		return agreement
	}

	public static meemInterface() {
		const ethers = services.ethers.getInstance()
		const inter = new ethers.utils.Interface(meemABI)
		return inter
	}

	public static getAccessList(): MeemAPI.IAccessList {
		return (
			config.ENABLE_WHITELIST_TEST_DATA
				? _.merge(meemAccessList, meemAccessListTesting)
				: meemAccessList
		) as MeemAPI.IAccessList
	}

	public static getWhitelist() {
		const list = this.getAccessList()
		const whitelist = list.tokens

		return whitelist
	}

	/* Create a badged meem image */
	public static async createMeemImage(
		data: MeemAPI.v1.CreateMeemImage.IRequestBody
	): Promise<string> {
		let image
		if (!data.base64Image) {
			if (!data.tokenAddress) {
				throw new Error('MISSING_TOKEN_ADDRESS')
			}

			if (_.isUndefined(data.chain)) {
				throw new Error('MISSING_CHAIN_ID')
			}

			if (_.isUndefined(data.tokenId)) {
				throw new Error('MISSING_TOKEN_ID')
			}

			const contract = await this.erc721Contract({
				networkName: MeemAPI.chainToNetworkName(data.chain),
				address: data.tokenAddress
			})

			const tokenURI = await contract.tokenURI(data.tokenId)
			const metadata = await this.getErc721Metadata(tokenURI)

			if (!metadata.image) {
				throw new Error('INVALID_METADATA')
			}

			image = await this.getImageFromMetadata(metadata)
		} else {
			image = Buffer.from(data.base64Image, 'base64')
		}

		try {
			const badgeImagePath = path.resolve(
				process.cwd(),
				'src/lib/meem-badge.png'
			)
			const badgeImage = sharp(badgeImagePath)
			const meemImage = sharp(image)

			const meemImageMetadata = await meemImage.metadata()
			let meemImageWidth = meemImageMetadata.width || 400

			// Set max image size to 1024
			if (meemImageWidth > 1024) {
				meemImageWidth = meemImageWidth > 1024 ? 1024 : meemImageWidth
				meemImage.resize(meemImageWidth)
			}

			const meemBadgeOffset = Math.round(meemImageWidth * 0.02)
			const meemBadgeWidth = Math.round(meemImageWidth * 0.2)

			const badgeImageBuffer = await badgeImage
				.resize(meemBadgeWidth)
				.toBuffer()

			const compositeMeemImage = await meemImage
				.composite([
					{
						input: badgeImageBuffer,
						top: meemBadgeOffset,
						left: meemBadgeOffset,
						blend: 'hard-light'
					}
				])
				.png({
					quality: 99
				})
				.toBuffer()

			const base64MeemImage = compositeMeemImage.toString('base64')

			return base64MeemImage
		} catch (e) {
			log.crit(e)
			throw new Error('CREATE_IMAGE_ERROR')
		}
	}

	public static async getContractInfo(options: {
		contractAddress: string
		chainId: number
		tokenId: Ethers.BigNumberish
		networkName: MeemAPI.NetworkName
	}) {
		const { contractAddress, tokenId, networkName, chainId } = options
		const isMeemToken =
			contractAddress.toLowerCase() === config.MEEM_PROXY_ADDRESS.toLowerCase()

		const contract = await this.erc721Contract({
			networkName,
			address: contractAddress
		})

		const {
			tokenURI: parentTokenURI,
			tokenMetadata: parentTokenMetadata,
			contractURI: parentContractURI,
			contractMetadata: parentContractMetadata
		} = await this.getMetadata({
			contract,
			tokenId
		})

		// Fetch root data unless this isn't a Meem in which case root is the parent
		const rootTokenAddress = contractAddress
		const rootTokenId = tokenId
		let rootTokenMetadata = parentTokenMetadata
		let rootTokenURI = parentTokenURI
		let rootContractURI = parentContractURI
		let rootContractMetadata = parentContractMetadata

		if (isMeemToken) {
			const agreement = await this.getAgreement({
				address: contractAddress,
				chainId
			})
			// const meem = await agreement.getMeem(tokenId)
			// rootTokenAddress = meem.root
			// rootTokenId = meem.rootTokenId

			const meemInfo = await this.getMetadata({
				contract: agreement,
				tokenId
			})

			rootTokenMetadata = meemInfo.tokenMetadata
			rootTokenURI = meemInfo.tokenURI
			rootContractMetadata = meemInfo.contractMetadata
			rootContractURI = meemInfo.contractURI
		}

		return {
			parentTokenAddress: contractAddress,
			parentTokenId: tokenId,
			parentTokenURI,
			parentTokenMetadata,
			parentContractURI,
			parentContractMetadata,
			rootTokenAddress,
			rootTokenId,
			rootTokenURI,
			rootTokenMetadata,
			rootContractURI,
			rootContractMetadata
		}
	}

	public static async getMetadata(options: {
		contract: ERC721 | Mycontract
		tokenId: Ethers.BigNumberish
	}) {
		const { contract, tokenId } = options
		const tokenURI = await contract.tokenURI(tokenId)
		const tokenMetadata = await this.getErc721Metadata(tokenURI)
		let contractURI: string | undefined
		let contractMetadata: MeemAPI.IERC721Metadata | undefined

		try {
			contractURI = await contract.contractURI()
		} catch (e) {
			log.warn(e)
		}
		if (contractURI) {
			try {
				contractMetadata = await this.getErc721Metadata(contractURI)
			} catch (e) {
				log.warn(e)
			}
		}

		return {
			tokenURI,
			tokenMetadata,
			contractURI,
			contractMetadata
		}
	}

	public static parseMeemData(data: string): Record<string, any> {
		let parsedData: Record<string, any> | undefined

		try {
			if (/^data:application\/json/.test(data)) {
				const json = Buffer.from(data.substring(29), 'base64').toString()
				parsedData = JSON.parse(json)
			}
		} catch (e) {
			log.trace(e)
		}

		try {
			if (!parsedData && data !== '') {
				parsedData = JSON.parse(data)
			}
		} catch (e) {
			log.trace(e)
		}

		return parsedData ?? {}
	}
}
