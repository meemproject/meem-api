import * as path from 'path'
import { ethers } from 'ethers'
import { isUndefined as _isUndefined, keys as _keys } from 'lodash'
import sharp from 'sharp'
import request from 'superagent'
import { v4 as uuidv4 } from 'uuid'
import ERC721ABI from '../abis/ERC721.json'
import MeemABI from '../abis/Meem.json'
import meemWhitelist from '../lib/meem-whitelist.json'
import { Meem, ERC721 } from '../types'
import { MeemPropertiesStructOutput, SplitStruct } from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import { IERC721Metadata, NetworkName } from '../types/shared/meem.shared'

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
			const badgeImagePath = path.resolve(__dirname, '../lib/meem-badge.png')
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
			throw new Error('UNKNOWN')
		}
	}

	public static async saveMeemMetadataasync({
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
	}: {
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

		if (
			!data.permissions?.owner?.copyPermissions ||
			!data.permissions?.owner?.splits
		) {
			throw new Error('INVALID_PERMISSIONS')
		}

		const isMeemToken = data.tokenAddress === config.MEEM_PROXY_ADDRESS
		const meemRegistry = await services.meem.getWhitelist()

		const validMeemProject =
			isMeemToken ||
			_keys(meemRegistry).find(contractId => contractId === data.tokenAddress)

		// if (!validMeemProject) {
		// 	throw new Error('INVALID_MEEM_PROJECT')
		// }

		const contract = isMeemToken
			? this.meemContract()
			: this.erc721Contract({
					networkName: data.verifyOwnerOnTestnet
						? NetworkName.Rinkeby
						: NetworkName.Mainnet,
					address: data.tokenAddress
			  })

		const owner = await contract.ownerOf(data.tokenId)
		const isNFTOwner = owner.toLowerCase() === data.accountAddress.toLowerCase()

		// if (!isMeemToken && !isNFTOwner) {
		// 	throw new Error('TOKEN_NOT_OWNED')
		// }

		let childMeemData:
			| {
					rootTokenAddress: string
					rootTokenId: number
					rootTokenURI: string
					rootMetadata: IERC721Metadata
					properties: MeemPropertiesStructOutput
					childProperties: MeemPropertiesStructOutput
					generation: number
			  }
			| undefined

		if (isMeemToken) {
			const meem = await (contract as Meem).getMeem(data.tokenId)
			const rootContract = this.erc721Contract({
				networkName: data.verifyOwnerOnTestnet
					? NetworkName.Rinkeby
					: NetworkName.Mainnet,
				address: meem.root
			})
			let rootContractMetadata: IERC721Metadata = {}
			const rootTokenURI = await rootContract.tokenURI(meem.rootTokenId)

			try {
				const rootContractURI = await rootContract.contractURI()
				rootContractMetadata = await this.getErc721Metadata(rootContractURI)
			} catch (e) {
				// No contractURI
			}

			const rootMetadata = await this.getErc721Metadata(rootTokenURI)

			rootMetadata.description =
				rootMetadata.description || rootContractMetadata.description || ''

			childMeemData = {
				rootTokenAddress: meem.root,
				rootTokenId: meem.rootTokenId.toNumber(),
				rootTokenURI,
				rootMetadata,
				properties: meem.properties,
				childProperties: meem.childProperties,
				generation: 0
			}
		}

		let contractMetadata: IERC721Metadata = {}
		const tokenURI = await contract.tokenURI(data.tokenId)

		try {
			const contractURI = await contract.contractURI()
			contractMetadata = await this.getErc721Metadata(contractURI)
		} catch (e) {
			// No contractURI
		}

		const metadata = await this.getErc721Metadata(tokenURI)

		const image = await this.getImageFromMetadata(metadata)

		const imageBase64String = image.toString('base64')

		const base64MeemImage = isMeemToken
			? imageBase64String
			: await this.createMeemImage({
					base64Image: imageBase64String
			  })

		metadata.description =
			metadata.description || contractMetadata.description || ''

		const meemMetadata = await this.saveMeemMetadataasync({
			collectionName: contractMetadata.name,
			imageBase64: base64MeemImage,
			tokenAddress: data.tokenAddress,
			tokenId: data.tokenId,
			parentMetadata: metadata,
			tokenURI,
			rootTokenAddress: childMeemData?.rootTokenAddress,
			rootTokenId: childMeemData?.rootTokenId,
			rootTokenURI: childMeemData?.rootTokenURI,
			rootTokenMetadata: childMeemData?.rootMetadata
		})

		const meemContract = this.meemContract()

		// Mint the Meem

		const splitsData: SplitStruct[] = []

		try {
			data.permissions.owner.splits.forEach(s => {
				if (s.toAddress && !_isUndefined(s.amount)) {
					splitsData.push({
						toAddress: s.toAddress,
						amount: s.amount,
						lockedBy: s.lockedBy
							? s.lockedBy
							: '0x0000000000000000000000000000000000000000'
					})
				} else {
					throw new Error('Splits formatted incorrectly')
				}
			})
		} catch (e) {
			throw new Error('INVALID_SPLITS')
		}

		return [
			data.accountAddress,
			meemMetadata.tokenURI,
			data.chain,
			childMeemData ? childMeemData.rootTokenAddress : data.tokenAddress,
			childMeemData ? childMeemData.rootTokenId : data.tokenId,
			data.tokenAddress,
			data.tokenId,
			childMeemData
				? childMeemData.properties
				: {
						copyPermissions: data.permissions.owner.copyPermissions.map(
							(p, i) => {
								return {
									permission: _isUndefined(
										data.permissions.owner.copyPermissions[i].permission
									)
										? 1
										: data.permissions.owner.copyPermissions[i].permission,
									addresses: _isUndefined(
										data.permissions.owner.copyPermissions[i].addresses
									)
										? []
										: data.permissions.owner.copyPermissions[i].addresses,
									numTokens: _isUndefined(
										data.permissions.owner.copyPermissions[i].numTokens
									)
										? 0
										: data.permissions.owner.copyPermissions[i].numTokens,
									lockedBy:
										data.permissions.owner.copyPermissions[i].lockedBy ||
										'0x0000000000000000000000000000000000000000'
								}
							}
						),
						remixPermissions: [
							{
								permission: 1,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						readPermissions: [
							{
								permission: 1,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						copyPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						remixPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						readPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						splits: splitsData,
						splitsLockedBy: '0x0000000000000000000000000000000000000000',
						childrenPerWallet: -1,
						childrenPerWalletLockedBy:
							'0x0000000000000000000000000000000000000000',
						totalChildren: _isUndefined(data.permissions?.owner?.totalChildren)
							? -1
							: data.permissions?.owner?.totalChildren,
						totalChildrenLockedBy: '0x0000000000000000000000000000000000000000'
				  },
			childMeemData
				? childMeemData.childProperties
				: {
						copyPermissions: [
							{
								permission: 0,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						remixPermissions: [
							{
								permission: 0,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						readPermissions: [
							{
								permission: 0,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						copyPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						remixPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						readPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						splits: splitsData,
						splitsLockedBy: '0x0000000000000000000000000000000000000000',
						childrenPerWallet: -1,
						childrenPerWalletLockedBy:
							'0x0000000000000000000000000000000000000000',
						totalChildren: 0,
						totalChildrenLockedBy: '0x0000000000000000000000000000000000000000'
				  }
		]

		const meem = await meemContract.mint(
			data.accountAddress,
			meemMetadata.tokenURI,
			data.chain,
			childMeemData ? childMeemData.rootTokenAddress : data.tokenAddress,
			childMeemData ? childMeemData.rootTokenId : data.tokenId,
			data.tokenAddress,
			data.tokenId,
			childMeemData
				? childMeemData.properties
				: {
						copyPermissions: data.permissions.owner.copyPermissions.map(
							(p, i) => {
								return {
									permission: _isUndefined(
										data.permissions.owner.copyPermissions[i].permission
									)
										? 1
										: data.permissions.owner.copyPermissions[i].permission,
									addresses: _isUndefined(
										data.permissions.owner.copyPermissions[i].addresses
									)
										? []
										: data.permissions.owner.copyPermissions[i].addresses,
									numTokens: _isUndefined(
										data.permissions.owner.copyPermissions[i].numTokens
									)
										? 0
										: data.permissions.owner.copyPermissions[i].numTokens,
									lockedBy:
										data.permissions.owner.copyPermissions[i].lockedBy ||
										'0x0000000000000000000000000000000000000000'
								}
							}
						),
						remixPermissions: [
							{
								permission: 1,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						readPermissions: [
							{
								permission: 1,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						copyPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						remixPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						readPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						splits: splitsData,
						splitsLockedBy: '0x0000000000000000000000000000000000000000',
						childrenPerWallet: -1,
						childrenPerWalletLockedBy:
							'0x0000000000000000000000000000000000000000',
						totalChildren: _isUndefined(data.permissions?.owner?.totalChildren)
							? -1
							: data.permissions?.owner?.totalChildren,
						totalChildrenLockedBy: '0x0000000000000000000000000000000000000000'
				  },
			childMeemData
				? childMeemData.childProperties
				: {
						copyPermissions: [
							{
								permission: 0,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						remixPermissions: [
							{
								permission: 0,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						readPermissions: [
							{
								permission: 0,
								addresses: [],
								numTokens: 0,
								lockedBy: '0x0000000000000000000000000000000000000000'
							}
						],
						copyPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						remixPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						readPermissionsLockedBy:
							'0x0000000000000000000000000000000000000000',
						splits: splitsData,
						splitsLockedBy: '0x0000000000000000000000000000000000000000',
						childrenPerWallet: -1,
						childrenPerWalletLockedBy:
							'0x0000000000000000000000000000000000000000',
						totalChildren: 0,
						totalChildrenLockedBy: '0x0000000000000000000000000000000000000000'
				  }
		)

		const receipt = await meem.wait()

		const transferEvent = receipt.events?.find(e => e.event === 'Transfer')

		if (transferEvent && transferEvent.args && transferEvent.args[2]) {
			const tokenId = (transferEvent.args[2] as ethers.BigNumber).toNumber()
			return {
				transactionHash: receipt.transactionHash,
				tokenId
			}
		}
		throw new Error('TRANSFER_EVENT_NOT_FOUND')
	}
}
