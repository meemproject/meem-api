import * as path from 'path'
import { ethers } from 'ethers'
import { isUndefined as _isUndefined } from 'lodash'
import sharp from 'sharp'
import request from 'superagent'
import { v4 as uuidv4 } from 'uuid'
import ERC721ABI from '../abis/ERC721.json'
import MeemABI from '../abis/Meem.json'
import meemWhitelist from '../lib/meem-whitelist.json'
import { Meem, ERC721 } from '../types'
import {
	MeemPermissionStructOutput,
	MeemPropertiesStructOutput,
	MeemStructOutput,
	SplitStructOutput
} from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import {
	IERC721Metadata,
	NetworkName,
	PermissionType
} from '../types/shared/meem.shared'

export default class MeemService {
	/** Get generic ERC721 contract instance */
	public static erc721Contract(options: {
		networkName: NetworkName
		address: string
	}) {
		const { networkName, address } = options
		let provider: ethers.providers.Provider
		switch (networkName) {
			case NetworkName.Mainnet:
			case NetworkName.Rinkeby:
				provider = new ethers.providers.InfuraProvider(
					networkName,
					config.INFURA_ID
				)
				break

			case NetworkName.Polygon:
				provider = new ethers.providers.JsonRpcProvider(
					'https://polygon-rpc.com'
				)
				break

			default:
				throw new Error('INVALID_NETWORK')
		}

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const contract = new ethers.Contract(address, ERC721ABI, wallet) as ERC721

		return contract
	}

	public static async getErc721Metadata(uri: string) {
		let metadata: IERC721Metadata
		if (/^data:application\/json/.test(uri)) {
			const json = Buffer.from(uri.substring(29), 'base64').toString()
			const result = JSON.parse(json)
			metadata = result
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

	public static async getImageFromMetadata(metadata: IERC721Metadata) {
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
	public static meemContract() {
		const provider = new ethers.providers.InfuraProvider(
			config.NETWORK,
			config.INFURA_ID
		)
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const meemContract = new ethers.Contract(
			config.MEEM_PROXY_ADDRESS,
			MeemABI,
			wallet
		) as Meem

		return meemContract
	}

	public static meemInterface() {
		const inter = new ethers.utils.Interface(MeemABI)
		return inter
	}

	public static getWhitelist() {
		const list: Record<string, MeemAPI.IWhitelistItem> = {}
		Object.keys(meemWhitelist).forEach(k => {
			const item = (meemWhitelist as MeemAPI.IWhitelist)[k]
			const license = Object.keys(MeemAPI.License).includes(item.license)
				? item.license
				: MeemAPI.License.Unknown
			list[k] = {
				...item,
				license
			}
		})

		return list
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

			if (_isUndefined(data.chain)) {
				throw new Error('MISSING_CHAIN_ID')
			}

			if (_isUndefined(data.tokenId)) {
				throw new Error('MISSING_TOKEN_ID')
			}

			const contract = this.erc721Contract({
				networkName: data.useTestnet
					? NetworkName.Rinkeby
					: NetworkName.Mainnet,
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
			const meemImageWidth = meemImageMetadata.width || 400
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
				.toBuffer()

			const base64MeemImage = compositeMeemImage.toString('base64')

			return base64MeemImage
		} catch (e) {
			log.crit(e)
			throw new Error('CREATE_IMAGE_ERROR')
		}
	}

	public static async saveMeemMetadataasync(options: {
		imageBase64: string
		tokenAddress: string
		tokenId?: number
		collectionName?: string
		parentMetadata: IERC721Metadata
		tokenURI: string
		meemId?: string
		rootTokenURI?: string
		rootTokenAddress?: string
		rootTokenId?: number
		rootTokenMetadata?: IERC721Metadata
	}): Promise<{ metadata: MeemAPI.IMeemMetadata; tokenURI: string }> {
		const {
			imageBase64,
			tokenAddress,
			tokenId,
			collectionName,
			parentMetadata,
			tokenURI,
			meemId,
			rootTokenURI,
			rootTokenAddress,
			rootTokenId,
			rootTokenMetadata
		} = options

		const id = meemId || uuidv4()

		const result = await services.git.saveMeemMetadata({
			rootTokenURI,
			rootTokenAddress,
			rootTokenId,
			rootTokenMetadata,
			imageBase64,
			tokenAddress,
			tokenId,
			collectionName,
			name: parentMetadata.name || '',
			description: parentMetadata.description || '',
			originalImage: parentMetadata.image || '',
			tokenURI,
			tokenMetadata: parentMetadata,
			meemId: id
		})

		return result
	}

	/** Mint a Meem */
	public static async mintMeem(data: MeemAPI.v1.MintMeem.IRequestBody) {
		if (!data.tokenAddress) {
			throw new Error('MISSING_TOKEN_ADDRESS')
		}

		if (_isUndefined(data.chain)) {
			throw new Error('MISSING_CHAIN_ID_ID')
		}

		if (_isUndefined(data.tokenId)) {
			throw new Error('MISSING_TOKEN_ID')
		}

		if (!data.accountAddress) {
			throw new Error('MISSING_ACCOUNT_ADDRESS')
		}

		const isMeemToken =
			data.tokenAddress.toLowerCase() ===
			config.MEEM_PROXY_ADDRESS.toLowerCase()
		const chain = isMeemToken ? 1 : data.chain
		const shouldIgnoreWhitelist =
			config.NETWORK === MeemAPI.NetworkName.Rinkeby &&
			data.shouldIgnoreWhitelist

		if (!isMeemToken && !shouldIgnoreWhitelist) {
			const isValidMeemProject = await this.isValidMeemProject(
				data.tokenAddress
			)

			if (!isValidMeemProject) {
				throw new Error('INVALID_MEEM_PROJECT')
			}
		}

		const contract = isMeemToken
			? this.meemContract()
			: this.erc721Contract({
					networkName: MeemAPI.chainToNetworkName(chain),
					address: data.tokenAddress
			  })

		const shouldIgnoreOwnership =
			config.NETWORK === MeemAPI.NetworkName.Rinkeby &&
			data.shouldIgnoreOwnership

		if (!shouldIgnoreOwnership) {
			const owner = await contract.ownerOf(data.tokenId)
			const isNFTOwner =
				owner.toLowerCase() === data.accountAddress.toLowerCase()
			if (!isNFTOwner) {
				throw new Error('TOKEN_NOT_OWNED')
			}
		}

		const contractInfo = await this.getContractInfo({
			contractAddress: data.tokenAddress,
			tokenId: data.tokenId,
			networkName:
				// If this isn't a Meem token and we're using testnet, get token contract from mainnet
				!isMeemToken && config.NETWORK === MeemAPI.NetworkName.Rinkeby
					? MeemAPI.NetworkName.Mainnet
					: config.NETWORK
		})

		const image = await this.getImageFromMetadata(
			contractInfo.parentTokenMetadata
		)

		const imageBase64String = image.toString('base64')

		const base64MeemImage = isMeemToken
			? imageBase64String
			: await this.createMeemImage({
					base64Image: imageBase64String
			  })

		const meemMetadata = await this.saveMeemMetadataasync({
			collectionName: contractInfo.parentContractMetadata?.name,
			imageBase64: base64MeemImage,
			tokenAddress: data.tokenAddress,
			tokenId: data.tokenId,
			parentMetadata: contractInfo.parentTokenMetadata,
			tokenURI: contractInfo.parentTokenURI,
			rootTokenAddress: contractInfo.rootTokenAddress,
			rootTokenId: contractInfo.rootTokenId,
			rootTokenURI: contractInfo.rootTokenURI,
			rootTokenMetadata: contractInfo.rootTokenMetadata
		})

		const meemContract = this.meemContract()

		const mintParams: Parameters<Meem['mint']> = [
			data.accountAddress,
			meemMetadata.tokenURI,
			chain,
			contractInfo.parentTokenAddress,
			contractInfo.parentTokenId,
			// TODO: Set root chain based on parent if necessary
			chain,
			contractInfo.rootTokenAddress,
			contractInfo.rootTokenId,
			this.buildProperties(data.properties),
			this.buildProperties({
				...data.childProperties,
				totalChildren: data.childProperties?.totalChildren ?? 0,
				splits: data.childProperties?.splits ?? data.properties?.splits
			}),
			// TODO: Set permission type based on copy/remix
			PermissionType.Copy
		]

		log.debug('Minting meem w/ params', { mintParams })

		const meem = await meemContract.mint(...mintParams)

		const receipt = await meem.wait()

		const transferEvent = receipt.events?.find(e => e.event === 'Transfer')

		if (transferEvent && transferEvent.args && transferEvent.args[2]) {
			const tokenId = (transferEvent.args[2] as ethers.BigNumber).toNumber()
			const returnData = {
				toAddress: data.accountAddress,
				tokenURI: meemMetadata.tokenURI,
				tokenId,
				transactionHash: receipt.transactionHash
			}
			await sockets?.emit({
				subscription: MeemAPI.MeemEvent.MeemMinted,
				eventName: MeemAPI.MeemEvent.MeemMinted,
				data: returnData
			})
			return returnData
		}
		throw new Error('TRANSFER_EVENT_NOT_FOUND')
	}

	public static async isValidMeemProject(contractAddress: string) {
		const isMeemToken = contractAddress === config.MEEM_PROXY_ADDRESS
		if (isMeemToken) {
			return true
		}
		const meemRegistry = await this.getWhitelist()

		const isValidMeemProject = Object.keys(meemRegistry).find(
			contractId => contractId.toLowerCase() === contractAddress.toLowerCase()
		)

		return !!isValidMeemProject
	}

	public static async getContractInfo(options: {
		contractAddress: string
		tokenId: number
		networkName: NetworkName
	}) {
		const { contractAddress, tokenId, networkName } = options
		const isMeemToken =
			contractAddress.toLowerCase() === config.MEEM_PROXY_ADDRESS.toLowerCase()

		const contract = this.erc721Contract({
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
		let rootTokenAddress = contractAddress
		let rootTokenId = tokenId
		let rootTokenMetadata = parentTokenMetadata
		let rootTokenURI = parentTokenURI
		let rootContractURI = parentContractURI
		let rootContractMetadata = parentContractMetadata

		if (isMeemToken) {
			const meemContract = this.meemContract()
			const meem = await meemContract.getMeem(tokenId)
			rootTokenAddress = meem.root
			rootTokenId = meem.rootTokenId.toNumber()

			const meemInfo = await this.getMetadata({
				contract: meemContract,
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
		contract: ERC721 | Meem
		tokenId: number
	}) {
		const { contract, tokenId } = options
		const tokenURI = await contract.tokenURI(tokenId)
		const tokenMetadata = await this.getErc721Metadata(tokenURI)
		let contractURI: string | undefined
		let contractMetadata: IERC721Metadata | undefined

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

	/** Take a partial set of properties and return a full set w/ defaults */
	public static buildProperties(
		props?: Partial<MeemAPI.IMeemProperties>
	): MeemAPI.IMeemProperties {
		return {
			copyPermissions: props?.copyPermissions ?? [
				{
					permission: 1,
					addresses: [],
					numTokens: 0,
					lockedBy: MeemAPI.zeroAddress
				}
			],
			remixPermissions: props?.remixPermissions ?? [
				{
					permission: 1,
					addresses: [],
					numTokens: 0,
					lockedBy: MeemAPI.zeroAddress
				}
			],
			readPermissions: props?.readPermissions ?? [
				{
					permission: 1,
					addresses: [],
					numTokens: 0,
					lockedBy: MeemAPI.zeroAddress
				}
			],
			copyPermissionsLockedBy:
				props?.copyPermissionsLockedBy ?? MeemAPI.zeroAddress,
			remixPermissionsLockedBy:
				props?.remixPermissionsLockedBy ?? MeemAPI.zeroAddress,
			readPermissionsLockedBy:
				props?.readPermissionsLockedBy ?? MeemAPI.zeroAddress,
			splits: props?.splits ?? [],
			splitsLockedBy: props?.splitsLockedBy ?? MeemAPI.zeroAddress,
			childrenPerWallet: props?.childrenPerWallet ?? -1,
			childrenPerWalletLockedBy:
				props?.childrenPerWalletLockedBy ?? MeemAPI.zeroAddress,
			totalChildren: props?.totalChildren ?? -1,
			totalChildrenLockedBy: props?.totalChildrenLockedBy ?? MeemAPI.zeroAddress
		}
	}

	public static meemToInterface(meem: MeemStructOutput): MeemAPI.IMeem {
		return {
			owner: meem[0],
			parentChain: meem[1],
			parent: meem[2],
			parentTokenId: meem[3].toNumber(),
			rootChain: meem[4],
			root: meem[5],
			rootTokenId: meem[6].toNumber(),
			generation: meem[7].toNumber(),
			properties: this.meemPropertiesToInterface(meem[8]),
			childProperties: this.meemPropertiesToInterface(meem[9])
		}
	}

	public static meemPropertiesToInterface(
		meemProperties: MeemPropertiesStructOutput
	): MeemAPI.IMeemProperties {
		return {
			totalChildren: meemProperties[0].toNumber(),
			totalChildrenLockedBy: meemProperties[1],
			childrenPerWallet: meemProperties[2].toNumber(),
			childrenPerWalletLockedBy: meemProperties[3],
			copyPermissions: meemProperties[4].map(perm =>
				this.meemPermissionToInterface(perm)
			),
			remixPermissions: meemProperties[5].map(perm =>
				this.meemPermissionToInterface(perm)
			),
			readPermissions: meemProperties[6].map(perm =>
				this.meemPermissionToInterface(perm)
			),
			copyPermissionsLockedBy: meemProperties[7],
			remixPermissionsLockedBy: meemProperties[8],
			readPermissionsLockedBy: meemProperties[9],
			splits: meemProperties[10].map(s => this.meemSplitToInterface(s)),
			splitsLockedBy: meemProperties[11]
		}
	}

	public static meemPermissionToInterface(
		meemPermission: MeemPermissionStructOutput
	): MeemAPI.IMeemPermission {
		return {
			permission: meemPermission[0],
			addresses: meemPermission[1],
			numTokens: meemPermission[2].toNumber(),
			lockedBy: meemPermission[3]
		}
	}

	public static meemSplitToInterface(
		split: SplitStructOutput
	): MeemAPI.IMeemSplit {
		return {
			toAddress: split[0],
			amount: split[1].toNumber(),
			lockedBy: split[2]
		}
	}
}
