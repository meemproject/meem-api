import * as path from 'path'
import { ethers } from 'ethers'
import _ from 'lodash'
import sharp from 'sharp'
import request from 'superagent'
import { v4 as uuidv4 } from 'uuid'
import ERC721ABI from '../abis/ERC721.json'
import MeemABI from '../abis/Meem.json'
import errors from '../config/errors'
import meemAccessListTesting from '../lib/meem-access-testing.json'
import meemAccessList from '../lib/meem-access.json'
import { Meem, ERC721 } from '../types'
import {
	MeemPermissionStructOutput,
	MeemPropertiesStructOutput,
	MeemStructOutput,
	SplitStructOutput
} from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import {
	IAccessList,
	IERC721Metadata,
	IMeemId,
	IMeemIdAccount,
	NetworkName,
	PermissionType
} from '../types/shared/meem.shared'

function errorcodeToErrorString(contractErrorName: string) {
	const allErrors: Record<string, any> = config.errors
	const errorKeys = Object.keys(allErrors)
	const errIdx = errorKeys.findIndex(
		k => allErrors[k].contractErrorCode === contractErrorName
	)
	if (errIdx > -1) {
		return errorKeys[errIdx]
	}
	return 'UNKNOWN_CONTRACT_ERROR'
}

function genericError(message?: string) {
	return {
		status: 'failure',
		code: 'SERVER_ERROR',
		reason: 'Unable to find specific error',
		friendlyReason:
			message ||
			'Sorry, something went wrong. Please try again in a few minutes.'
	}
}

function handleStringErrorKey(errorKey: string) {
	let err = config.errors.SERVER_ERROR
	// @ts-ignore
	if (errorKey && config.errors[errorKey]) {
		// @ts-ignore
		err = config.errors[errorKey]
	} else {
		log.warn(
			`errorResponder Middleware: Invalid error key specified: ${errorKey}`
		)
	}

	return {
		status: 'failure',
		httpCode: 500,
		reason: err.reason,
		friendlyReason: err.friendlyReason
	}
}

export default class MeemService {
	public static getProvider(options: { networkName: MeemAPI.NetworkName }) {
		const { networkName } = options
		let provider: ethers.providers.Provider
		switch (networkName) {
			case NetworkName.Mainnet:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_MAINNET)
				break

			case NetworkName.Rinkeby:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_RINKEBY)
				break

			case NetworkName.Polygon:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_POLYGON)
				break

			default:
				throw new Error('INVALID_NETWORK')
		}

		return provider
	}

	/** Get generic ERC721 contract instance */
	public static erc721Contract(options: {
		networkName: MeemAPI.NetworkName
		address: string
	}) {
		const { networkName, address } = options
		let provider: ethers.providers.Provider
		switch (networkName) {
			case NetworkName.Mainnet:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_MAINNET)
				break

			case NetworkName.Rinkeby:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_RINKEBY)
				break

			case NetworkName.Polygon:
				provider = new ethers.providers.JsonRpcProvider(config.JSON_RPC_POLYGON)
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
	public static getMeemContract() {
		const provider = new ethers.providers.JsonRpcProvider(
			config.NETWORK === 'rinkeby'
				? config.JSON_RPC_RINKEBY
				: config.JSON_RPC_POLYGON
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

			const contract = this.erc721Contract({
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

	public static async saveMeemMetadataasync(options: {
		name?: string
		description?: string
		imageBase64: string
		tokenAddress: string
		tokenId?: ethers.BigNumberish
		collectionName?: string
		parentMetadata: IERC721Metadata
		tokenURI: string
		meemId?: string
		rootTokenURI?: string
		rootTokenAddress?: string
		rootTokenId?: ethers.BigNumberish
		rootTokenMetadata?: IERC721Metadata
	}): Promise<{ metadata: MeemAPI.IMeemMetadata; tokenURI: string }> {
		const {
			name,
			description,
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
			name: name || parentMetadata.name || '',
			description:
				description || parentMetadata.description || collectionName
					? `${collectionName} – #${tokenId}`
					: '',
			originalImage: parentMetadata.image || '',
			tokenURI,
			tokenMetadata: parentMetadata,
			meemId: id
		})

		return result
	}

	/** Mint a Meem */
	public static async mintMeem(
		data: Omit<MeemAPI.v1.MintMeem.IRequestBody, 'base64Image'> & {
			s3ImagePath?: string
		}
	) {
		try {
			if (!data.tokenAddress) {
				throw new Error('MISSING_TOKEN_ADDRESS')
			}

			if (_.isUndefined(data.chain)) {
				throw new Error('MISSING_CHAIN_ID')
			}

			if (_.isUndefined(data.tokenId)) {
				throw new Error('MISSING_TOKEN_ID')
			}

			if (!data.accountAddress) {
				throw new Error('MISSING_ACCOUNT_ADDRESS')
			}

			const meemId = uuidv4()

			const isMeemToken =
				data.tokenAddress.toLowerCase() ===
				config.MEEM_PROXY_ADDRESS.toLowerCase()

			const isAccessAllowed = await this.isAccessAllowed({
				chain: data.chain,
				accountAddress: data.accountAddress,
				contractAddress: data.tokenAddress
			})

			if (!isAccessAllowed) {
				throw new Error('MINTING_ACCESS_DENIED')
			}

			// TODO: Remove redundant check and rely only on access?
			// const isValidMeemProject = await this.isValidMeemProject({
			// 	chain: data.chain,
			// 	contractAddress: data.tokenAddress
			// })

			// if (!isValidMeemProject) {
			// 	throw new Error('INVALID_MEEM_PROJECT')
			// }

			const contract = isMeemToken
				? this.getMeemContract()
				: this.erc721Contract({
						networkName: MeemAPI.chainToNetworkName(data.chain),
						address: data.tokenAddress
				  })

			const owner = await contract.ownerOf(data.tokenId)
			const isNFTOwner =
				owner.toLowerCase() === data.accountAddress.toLowerCase()
			if (!isNFTOwner) {
				throw new Error('TOKEN_NOT_OWNED')
			}

			const contractInfo = await this.getContractInfo({
				contractAddress: data.tokenAddress,
				tokenId: data.tokenId,
				networkName: MeemAPI.chainToNetworkName(data.chain)
			})

			let base64Image: string | undefined

			if (data.s3ImagePath) {
				const imageData = await services.storage.getObject({
					path: data.s3ImagePath
				})

				base64Image = imageData.toString('base64')
			}

			const image =
				base64Image ||
				(await this.getImageFromMetadata(contractInfo.parentTokenMetadata))

			const imageBase64String = base64Image || image.toString('base64')

			const base64MeemImage = isMeemToken
				? imageBase64String
				: await this.createMeemImage({
						base64Image: imageBase64String
				  })

			const [meemMetadata] = await Promise.all([
				this.saveMeemMetadataasync({
					name: data.name,
					description: data.description,
					collectionName: contractInfo.parentContractMetadata?.name,
					imageBase64: base64MeemImage,
					tokenAddress: data.tokenAddress,
					tokenId: data.tokenId,
					parentMetadata: contractInfo.parentTokenMetadata,
					tokenURI: contractInfo.parentTokenURI,
					rootTokenAddress: contractInfo.rootTokenAddress,
					rootTokenId: contractInfo.rootTokenId,
					rootTokenURI: contractInfo.rootTokenURI,
					rootTokenMetadata: contractInfo.rootTokenMetadata,
					meemId
				}),
				data.s3ImagePath
					? services.storage.deleteObject({ path: data.s3ImagePath })
					: Promise.resolve(null)
			])

			const meemContract = this.getMeemContract()

			let { recommendedGwei } = await services.web3.getGasEstimate({
				chain: MeemAPI.networkNameToChain(config.NETWORK)
			})

			if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
				// throw new Error('GAS_PRICE_TOO_HIGH')
				log.warn(`Recommended fee over max: ${recommendedGwei}`)
				recommendedGwei = config.MAX_GAS_PRICE_GWEI
			}

			const mintParams: Parameters<Meem['mint']> = [
				data.accountAddress,
				meemMetadata.tokenURI,
				data.chain,
				contractInfo.parentTokenAddress,
				contractInfo.parentTokenId,
				// TODO: Set root chain based on parent if necessary
				data.chain,
				contractInfo.rootTokenAddress,
				contractInfo.rootTokenId,
				this.buildProperties(data.properties),
				this.buildProperties({
					...data.childProperties,
					totalChildren: services.web3
						.toBigNumber(data.childProperties?.totalChildren ?? 0)
						.toHexString(),
					splits: data.childProperties?.splits ?? data.properties?.splits
				}),
				// TODO: Set permission type based on copy/remix
				PermissionType.Copy,
				{
					gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
				}
			]

			log.debug('Minting meem w/ params', { mintParams })

			const mintTx = await meemContract.mint(...mintParams)

			log.debug(`Minting w/ transaction hash: ${mintTx.hash}`)

			const receipt = await mintTx.wait()

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
				try {
					const newMeem = await meemContract.getMeem(returnData.tokenId)
					const branchName =
						config.NETWORK === MeemAPI.NetworkName.Rinkeby ? `test` : `master`
					await services.git.updateMeemMetadata({
						tokenURI: `https://raw.githubusercontent.com/meemproject/metadata/${branchName}/meem/${meemId}.json`,
						generation: newMeem.generation.toNumber(),
						tokenId: returnData.tokenId,
						metadataId: meemId
					})
				} catch (updateErr) {
					log.warn('Error updating Meem metadata', updateErr)
				}

				return returnData
			}
			throw new Error('TRANSFER_EVENT_NOT_FOUND')
		} catch (e) {
			const err = e as any

			log.warn(err)

			if (err.error?.error?.body) {
				let errStr = 'UNKNOWN_CONTRACT_ERROR'
				try {
					const body = JSON.parse(err.error.error.body)
					log.warn(body)
					const inter = services.meem.meemInterface()
					const errInfo = inter.parseError(body.error.data)
					errStr = errorcodeToErrorString(errInfo.name)
				} catch (parseError) {
					// Unable to parse
					return genericError()
				}
				const error = handleStringErrorKey(errStr)
				await sockets?.emitError(error, data.accountAddress)
				throw new Error(errStr)
			}
			if (err.message) {
				const error = handleStringErrorKey(err.message)
				await sockets?.emitError(error, data.accountAddress)
				throw new Error(err.message)
			}
			await sockets?.emitError(errors.SERVER_ERROR, data.accountAddress)
			throw new Error('SERVER_ERROR')
		}
	}

	// TODO: Add mintOriginalMeem method

	public static async isValidMeemProject(options: {
		chain: MeemAPI.Chain
		contractAddress: string
	}) {
		const { chain, contractAddress } = options
		const isMeemToken = contractAddress === config.MEEM_PROXY_ADDRESS
		if (isMeemToken) {
			return true
		}
		const meemRegistry = await this.getWhitelist()

		const isValidMeemProject = Object.keys(meemRegistry).find(
			contractId =>
				meemRegistry[contractId].chain === chain &&
				contractId.toLowerCase() === contractAddress.toLowerCase()
		)

		return !!isValidMeemProject
	}

	public static async isAccessAllowed(options: {
		chain: MeemAPI.Chain
		accountAddress: string
		contractAddress: string
	}) {
		const { accountAddress, contractAddress } = options
		const chain = +options.chain
		let isAccessAllowed = false
		const access: any = {}

		const accessList = await this.getAccessList()

		const accountAccessKey = Object.keys(accessList.addresses).find(
			address => address.toLowerCase() === accountAddress.toLowerCase()
		)

		const contractAccessKey = Object.keys(accessList.tokens).find(
			contractId => contractId.toLowerCase() === contractAddress.toLowerCase()
		)

		if (contractAccessKey) {
			const contractAccess = accessList.tokens[contractAccessKey]
			isAccessAllowed =
				contractAccess.chain === chain &&
				(contractAccess.allAddresses ||
					!!contractAccess.addresses?.includes(accountAddress))

			access.contractAccess = contractAccess
		}

		if (!contractAccessKey && accountAccessKey) {
			const accountAccess = accessList.addresses[accountAccessKey]
			isAccessAllowed =
				accountAccess.allTokens ||
				!!accountAccess.tokens?.includes(contractAddress)
			access.accountAccess = accountAccess
		}

		return isAccessAllowed
	}

	public static async getContractInfo(options: {
		contractAddress: string
		tokenId: ethers.BigNumberish
		networkName: NetworkName
	}) {
		const { contractAddress, tokenId, networkName } = options
		log.debug(networkName, contractAddress)
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
			const meemContract = this.getMeemContract()
			const meem = await meemContract.getMeem(tokenId)
			rootTokenAddress = meem.root
			rootTokenId = meem.rootTokenId

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
		tokenId: ethers.BigNumberish
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
					numTokens: services.web3.toBigNumber(0).toHexString(),
					lockedBy: MeemAPI.zeroAddress
				}
			],
			remixPermissions: props?.remixPermissions ?? [
				{
					permission: 1,
					addresses: [],
					numTokens: services.web3.toBigNumber(0).toHexString(),
					lockedBy: MeemAPI.zeroAddress
				}
			],
			readPermissions: props?.readPermissions ?? [
				{
					permission: 1,
					addresses: [],
					numTokens: services.web3.toBigNumber(0).toHexString(),
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
			childrenPerWallet: services.web3
				.toBigNumber(props?.childrenPerWallet ?? -1)
				.toHexString(),
			childrenPerWalletLockedBy:
				props?.childrenPerWalletLockedBy ?? MeemAPI.zeroAddress,
			totalChildren: services.web3
				.toBigNumber(props?.totalChildren ?? -1)
				.toHexString(),
			totalChildrenLockedBy: props?.totalChildrenLockedBy ?? MeemAPI.zeroAddress
		}
	}

	public static meemToInterface(meem: MeemStructOutput): MeemAPI.IMeem {
		return {
			owner: meem[0],
			parentChain: meem[1],
			parent: meem[2],
			parentTokenId: meem[3].toHexString(),
			rootChain: meem[4],
			root: meem[5],
			rootTokenId: meem[6].toHexString(),
			generation: meem[7].toNumber(),
			properties: this.meemPropertiesToInterface(meem[8]),
			childProperties: this.meemPropertiesToInterface(meem[9]),
			mintedAt: meem[10].toNumber()
		}
	}

	public static meemPropertiesToInterface(
		meemProperties: MeemPropertiesStructOutput
	): MeemAPI.IMeemProperties {
		return {
			totalChildren: meemProperties[0].toHexString(),
			totalChildrenLockedBy: meemProperties[1],
			childrenPerWallet: meemProperties[2].toHexString(),
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
			numTokens: meemPermission[2].toHexString(),
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

	public static createOrUpdateMeemId({
		meemId,
		account,
		accountAddress
	}: {
		meemId?: string
		account: IMeemIdAccount
		accountAddress: string
	}): MeemAPI.IMeemId {
		// TODO: Create MeemId contract if one does not exist
		// TODO: Create/Update private MeemId record with account
		return {
			id: meemId || '',
			accountAddress,
			verifiedAccounts: [account]
		}
	}

	public static searchForMeemIdByAccountAddress(
		accountAddress: string
	): IMeemId {
		// TODO: Get Meem Id from accountAddress
		const meemId: IMeemId = {
			id: '',
			accountAddress: accountAddress || '',
			verifiedAccounts: []
		}
		return meemId
	}
}
