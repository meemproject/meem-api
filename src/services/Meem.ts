/* eslint-disable import/no-extraneous-dependencies */
import * as path from 'path'
import meemABI from '@meemproject/meem-contracts/types/Meem.json'
import type { ethers as Ethers } from 'ethers'
import fs from 'fs-extra'
import _ from 'lodash'
import { DateTime } from 'luxon'
import sharp from 'sharp'
import request from 'superagent'
import { v4 as uuidv4 } from 'uuid'
import ERC721ABI from '../abis/ERC721.json'
import errors from '../config/errors'
import meemAccessListTesting from '../lib/meem-access-testing.json'
import meemAccessList from '../lib/meem-access.json'
import type MeemModel from '../models/Meem'
import MeemIdentification from '../models/MeemIdentification'
import { Meem, ERC721 } from '../types'
import {
	MeemPermissionStructOutput,
	MeemPropertiesStructOutput,
	MeemStructOutput,
	SplitStructOutput
} from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import {
	MeemMetadataStorageProvider,
	MeemType
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
	/** Get generic ERC721 contract instance */
	public static async erc721Contract(options: {
		networkName: MeemAPI.NetworkName
		address: string
	}) {
		const ethers = services.ethers.getInstance()
		const { networkName, address } = options
		const provider = await services.ethers.getProvider({ networkName })

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const contract = new ethers.Contract(address, ERC721ABI, wallet) as ERC721

		return contract
	}

	public static async getErc721Metadata(uri: string) {
		let metadata: MeemAPI.IERC721Metadata
		if (uri.length === 0) {
			return {}
		}
		if (/^data:application\/json/.test(uri)) {
			const json = Buffer.from(uri.substring(29), 'base64').toString()
			metadata = JSON.parse(json)
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
	public static async getMeemContract(options: {
		address: string
		walletPrivateKey?: string
	}) {
		const ethers = services.ethers.getInstance()
		if (config.TESTING) {
			// @ts-ignore
			const c = (await ethers.getContractAt(meemABI, options.address))
				// @ts-ignore
				.connect(global.signer)
			// const c = await ethers.getContractAt(meemABI, options.address)
			return c as Meem
		}

		let walletPrivateKey = options.walletPrivateKey ?? config.WALLET_PRIVATE_KEY

		if (config.TESTING) {
			walletPrivateKey = config.HARDHAT_MEEM_CONTRACT_WALLET
		}

		const provider = await services.ethers.getProvider()

		const wallet = new ethers.Wallet(walletPrivateKey, provider)

		const meemContract = new ethers.Contract(
			options.address,
			meemABI,
			wallet
		) as Meem

		return meemContract
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

	public static async saveMeemMetadataasync(
		options: {
			name?: string
			description: string
			imageBase64: string
			collectionName?: string
			meemId?: string
			extensionProperties?: MeemAPI.IMeemMetadata['extension_properties']
		},
		storageProvider?: MeemMetadataStorageProvider
	): Promise<{ metadata: MeemAPI.IMeemMetadata; tokenURI: string }> {
		const {
			name,
			description,
			imageBase64,
			collectionName,
			meemId,
			extensionProperties
		} = options

		const id = meemId || uuidv4()

		const metadata: MeemAPI.ICreateMeemMetadata = {
			name: collectionName ? `${collectionName} – ${name}` : `${name}`,
			description,
			external_url: `${config.MEEM_DOMAIN}/meems/${id}`,
			meem_id: meemId,
			...(extensionProperties && {
				extension_properties: extensionProperties
			})
		}

		switch (storageProvider) {
			case MeemMetadataStorageProvider.Git:
				return services.git.saveMeemMetadata({
					imageBase64,
					metadata,
					meemId: id
				})
			default:
				return services.web3.saveMeemMetadata({
					imageBase64,
					metadata
				})
		}
	}

	/** Mint a Meem */
	public static async mintWrappedMeem(
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

			if (!isAccessAllowed && !config.TESTING) {
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

			const contract = await (isMeemToken
				? this.getMeemContract()
				: this.erc721Contract({
						networkName: MeemAPI.chainToNetworkName(data.chain),
						address: data.tokenAddress
				  }))

			const owner = await contract.ownerOf(data.tokenId)
			const isNFTOwner =
				owner.toLowerCase() === data.accountAddress.toLowerCase()
			if (
				!isNFTOwner &&
				data.accountAddress.toLowerCase() !==
					config.MEEM_PROXY_ADDRESS.toLowerCase()
			) {
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

			if (config.TESTING) {
				base64Image = ''
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
				this.saveMeemMetadataasync(
					{
						name: data.name,
						description: data.description || '',
						collectionName: contractInfo.parentContractMetadata?.name,
						imageBase64: base64MeemImage,
						meemId
					},
					MeemAPI.MeemMetadataStorageProvider.Ipfs
				),
				data.s3ImagePath
					? services.storage.deleteObject({ path: data.s3ImagePath })
					: Promise.resolve(null)
			])

			const meemContract = await this.getMeemContract()

			let { recommendedGwei } = await services.web3.getGasEstimate({
				chain: MeemAPI.networkNameToChain(config.NETWORK)
			})

			if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
				// throw new Error('GAS_PRICE_TOO_HIGH')
				log.warn(`Recommended fee over max: ${recommendedGwei}`)
				recommendedGwei = config.MAX_GAS_PRICE_GWEI
			}

			const mintParams: Parameters<Meem['mint']> = [
				{
					to: data.accountAddress,
					tokenURI: meemMetadata.tokenURI,
					parentChain: data.chain,
					parent: contractInfo.parentTokenAddress,
					parentTokenId: contractInfo.parentTokenId,
					meemType: MeemAPI.MeemType.Wrapped,
					data: '',
					isURILocked: true,
					uriSource: MeemAPI.UriSource.TokenUri,
					reactionTypes: ['upvote', 'downvote'],
					mintedBy: data.accountAddress
				},
				this.buildProperties(data.properties),
				this.buildProperties({
					...data.childProperties,
					totalCopies: services.web3
						.toBigNumber(data.childProperties?.totalCopies ?? 0)
						.toHexString(),
					splits: data.childProperties?.splits ?? data.properties?.splits
				}),
				{
					gasLimit: config.MINT_GAS_LIMIT,
					gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
				}
			]

			log.debug('Minting meem w/ params', { mintParams })

			const mintTx = await meemContract.mint(...mintParams)

			log.debug(`Minting w/ transaction hash: ${mintTx.hash}`)

			const receipt = await mintTx.wait()

			const transferEvent = receipt.events?.find(e => e.event === 'Transfer')

			if (transferEvent && transferEvent.args && transferEvent.args[2]) {
				const tokenId = (transferEvent.args[2] as Ethers.BigNumber).toNumber()
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

	public static async createMeemProject(options: {
		name: string
		description: string
		minterAddresses: string[]
	}) {
		const { name, description, minterAddresses } = options

		const projectImagePath = path.resolve(
			process.cwd(),
			'src/lib/meem-badge.png'
		)

		const projectImage = await fs.readFile(projectImagePath)

		const meemMetadata = await this.saveMeemMetadataasync(
			{
				name,
				description,
				collectionName: 'Meem Projects',
				imageBase64: projectImage.toString('base64'),
				meemId: uuidv4()
			},
			MeemAPI.MeemMetadataStorageProvider.Ipfs
		)

		const meemContract = await this.getMeemContract()

		let { recommendedGwei } = await services.web3.getGasEstimate({
			chain: MeemAPI.networkNameToChain(config.NETWORK)
		})

		if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
			// throw new Error('GAS_PRICE_TOO_HIGH')
			log.warn(`Recommended fee over max: ${recommendedGwei}`)
			recommendedGwei = config.MAX_GAS_PRICE_GWEI
		}

		const mintParams: Parameters<Meem['mint']> = [
			{
				to: config.MEEM_PROJECT_OWNER_ADDRESS,
				tokenURI: meemMetadata.tokenURI,
				parentChain: MeemAPI.networkNameToChain(config.NETWORK),
				parent: MeemAPI.zeroAddress,
				parentTokenId: 0,
				meemType: MeemAPI.MeemType.Original,
				data: '',
				isURILocked: true,
				uriSource: MeemAPI.UriSource.TokenUri,
				reactionTypes: MeemAPI.defaultReactionTypes,
				mintedBy: config.MEEM_PROJECT_OWNER_ADDRESS
			},
			this.buildProperties({
				copyPermissions: [
					{
						permission: MeemAPI.Permission.Addresses,
						addresses: minterAddresses,
						numTokens: '0',
						lockedBy: MeemAPI.zeroAddress,
						costWei: services.web3.toBigNumber(0).toHexString()
					}
				],
				remixPermissions: [
					{
						permission: MeemAPI.Permission.Addresses,
						addresses: minterAddresses,
						numTokens: '0',
						lockedBy: MeemAPI.zeroAddress,
						costWei: services.web3.toBigNumber(0).toHexString()
					}
				],
				splits: [
					{
						toAddress: config.MEEM_PROJECT_OWNER_ADDRESS,
						amount: 100,
						lockedBy: MeemAPI.zeroAddress
					}
				]
			}),
			this.buildProperties({
				splits: [
					{
						toAddress: config.MEEM_PROJECT_OWNER_ADDRESS,
						amount: 100,
						lockedBy: MeemAPI.zeroAddress
					}
				]
			}),
			{
				gasLimit: config.MINT_GAS_LIMIT,
				gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
			}
		]

		log.debug('Minting meem w/ params', { mintParams })

		const mintTx = await meemContract.mint(...mintParams)

		log.debug(`Minting w/ transaction hash: ${mintTx.hash}`)

		const receipt = await mintTx.wait()

		log.debug(`Finished minting: ${receipt.transactionHash}`)
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
		tokenId: Ethers.BigNumberish
		networkName: MeemAPI.NetworkName
	}) {
		const { contractAddress, tokenId, networkName } = options
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
		let rootTokenAddress = contractAddress
		let rootTokenId = tokenId
		let rootTokenMetadata = parentTokenMetadata
		let rootTokenURI = parentTokenURI
		let rootContractURI = parentContractURI
		let rootContractMetadata = parentContractMetadata

		if (isMeemToken) {
			const meemContract = await this.getMeemContract()
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

	/** Take a partial set of properties and return a full set w/ defaults */
	public static buildProperties(
		props?: Partial<MeemAPI.IMeemProperties>
	): MeemAPI.IMeemProperties {
		return {
			copyPermissions: props?.copyPermissions ?? [
				{
					permission: MeemAPI.Permission.Anyone,
					addresses: [],
					numTokens: services.web3.toBigNumber(0).toHexString(),
					lockedBy: MeemAPI.zeroAddress,
					costWei: services.web3.toBigNumber(0).toHexString()
				}
			],
			remixPermissions: props?.remixPermissions ?? [
				{
					permission: MeemAPI.Permission.Anyone,
					addresses: [],
					numTokens: services.web3.toBigNumber(0).toHexString(),
					lockedBy: MeemAPI.zeroAddress,
					costWei: services.web3.toBigNumber(0).toHexString()
				}
			],
			readPermissions: props?.readPermissions ?? [
				{
					permission: MeemAPI.Permission.Anyone,
					addresses: [],
					numTokens: services.web3.toBigNumber(0).toHexString(),
					lockedBy: MeemAPI.zeroAddress,
					costWei: services.web3.toBigNumber(0).toHexString()
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
			copiesPerWallet: services.web3
				.toBigNumber(props?.copiesPerWallet ?? -1)
				.toHexString(),
			copiesPerWalletLockedBy:
				props?.copiesPerWalletLockedBy ?? MeemAPI.zeroAddress,
			totalCopies: services.web3
				.toBigNumber(props?.totalCopies ?? 0)
				.toHexString(),
			totalCopiesLockedBy: props?.totalCopiesLockedBy ?? MeemAPI.zeroAddress,
			totalRemixes: services.web3
				.toBigNumber(props?.totalRemixes ?? -1)
				.toHexString(),
			remixesPerWallet: services.web3
				.toBigNumber(props?.remixesPerWallet ?? -1)
				.toHexString(),
			remixesPerWalletLockedBy:
				props?.remixesPerWalletLockedBy ?? MeemAPI.zeroAddress,
			totalRemixesLockedBy: props?.totalRemixesLockedBy ?? MeemAPI.zeroAddress
		}
	}

	public static meemToInterface(options: {
		tokenId: string
		meem: MeemStructOutput
	}): MeemAPI.IMeem {
		const { tokenId, meem } = options

		return {
			tokenId,
			owner: meem.owner,
			parentChain: meem.parentChain,
			parent: meem.parent,
			parentTokenId: meem.parentTokenId.toHexString(),
			rootChain: meem.rootChain,
			root: meem.root,
			rootTokenId: meem.rootTokenId.toHexString(),
			generation: meem.generation.toNumber(),
			properties: this.meemPropertiesToInterface(meem.properties),
			childProperties: this.meemPropertiesToInterface(meem.childProperties),
			mintedAt: meem.mintedAt.toNumber(),
			data: meem.data,
			uriLockedBy: meem.uriLockedBy,
			uriSource: meem.uriSource,
			reactionTypes: meem.reactionTypes,
			meemType: meem.meemType,
			mintedBy: meem.mintedBy
		}
	}

	public static meemPropertiesToInterface(
		meemProperties: MeemPropertiesStructOutput
	): MeemAPI.IMeemProperties {
		return {
			totalCopies: meemProperties.totalCopies.toHexString(),
			totalCopiesLockedBy: meemProperties.totalCopiesLockedBy,
			copiesPerWallet: meemProperties.copiesPerWallet.toHexString(),
			copiesPerWalletLockedBy: meemProperties.copiesPerWalletLockedBy,
			totalRemixes: meemProperties.totalRemixes.toHexString(),
			totalRemixesLockedBy: meemProperties.totalRemixesLockedBy,
			remixesPerWallet: meemProperties.remixesPerWallet.toHexString(),
			remixesPerWalletLockedBy: meemProperties.remixesPerWalletLockedBy,
			copyPermissions: meemProperties.copyPermissions.map(perm =>
				this.meemPermissionToInterface(perm)
			),
			remixPermissions: meemProperties.remixPermissions.map(perm =>
				this.meemPermissionToInterface(perm)
			),
			readPermissions: meemProperties.readPermissions.map(perm =>
				this.meemPermissionToInterface(perm)
			),
			copyPermissionsLockedBy: meemProperties.copyPermissionsLockedBy,
			remixPermissionsLockedBy: meemProperties.remixPermissionsLockedBy,
			readPermissionsLockedBy: meemProperties.readPermissionsLockedBy,
			splits: meemProperties.splits.map(s => this.meemSplitToInterface(s)),
			splitsLockedBy: meemProperties.splitsLockedBy
		}
	}

	public static meemPermissionToInterface(
		meemPermission: MeemPermissionStructOutput
	): MeemAPI.IMeemPermission {
		return {
			permission: meemPermission.permission,
			addresses: meemPermission.addresses,
			numTokens: meemPermission.numTokens.toHexString(),
			lockedBy: meemPermission.lockedBy,
			costWei: services.web3.toBigNumber(0).toHexString()
		}
	}

	public static meemSplitToInterface(
		split: SplitStructOutput
	): MeemAPI.IMeemSplit {
		return {
			toAddress: split.toAddress,
			amount: split.amount.toNumber(),
			lockedBy: split.lockedBy
		}
	}

	public static meemToIMeem(meem: MeemModel): MeemAPI.IMetadataMeem {
		if (!meem.Properties || !meem.ChildProperties) {
			log.crit('Meem must include Properties and ChildProperties')
			throw new Error('SERVER_ERROR')
		}
		return {
			tokenId: meem.tokenId,
			owner: meem.owner,
			parentChain: meem.parentChain,
			parent: meem.parent,
			parentTokenId: meem.parentTokenId,
			rootChain: meem.rootChain,
			root: meem.root,
			rootTokenId: meem.rootTokenId,
			generation: meem.generation,
			properties: meem.Properties,
			childProperties: meem.ChildProperties,
			mintedAt: DateTime.fromJSDate(meem.mintedAt).toSeconds(),
			data: meem.data,
			uriLockedBy: meem.uriLockedBy,
			uriSource: meem.uriSource,
			reactionTypes: meem.reactionTypes,
			metadata: meem.metadata,
			mintedBy: meem.mintedBy,
			meemType: meem.meemType,
			reactionCounts: meem.reactionCounts,
			addressReactions: meem.Reactions?.map(r => ({
				reaction: r.reaction,
				reactedAt: DateTime.fromJSDate(r.reactedAt).toSeconds(),
				address: r.address,
				MeemIdentificationId: r.MeemIdentificationId
			})),
			numCopies: meem.numCopies,
			numRemixes: meem.numRemixes
		}
	}

	public static async claimMeem(
		tokenId: string,
		meemIdentification: MeemIdentification
	): Promise<void> {
		let meem: MeemModel | null = null

		const tokenIdNumber = services.web3.toBigNumber(tokenId)
		meem = await orm.models.Meem.findOne({
			where: {
				tokenId: tokenIdNumber.toHexString()
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		const meemContract = await services.meem.getMeemContract()

		if (config.TESTING) {
			const [testMeemData, testMeemTokenUri] = await Promise.all([
				meemContract.getMeem(tokenIdNumber),
				meemContract.tokenURI(tokenIdNumber)
			])
			const meemInterface = services.meem.meemToInterface({
				tokenId: `${tokenIdNumber.toNumber()}`,
				meem: testMeemData
			})
			meem = await orm.models.Meem.create({
				...meemInterface,
				tokenURI: testMeemTokenUri
			})
		}

		if (!meem) {
			throw new Error('TOKEN_NOT_FOUND')
		}

		if (meem.owner.toLowerCase() !== config.MEEM_PROXY_ADDRESS.toLowerCase()) {
			throw new Error('NOT_AUTHORIZED')
		}

		const meemId = await services.meemId.getMeemId({
			meemIdentification
		})

		const meemberAlreadyOwns = meemId.wallets.find(w => {
			return w.toLowerCase() === meem?.owner.toLowerCase()
		})

		if (meemberAlreadyOwns) {
			return
		}

		const parentTokenIdString = services.web3
			.toBigNumber(meem.parentTokenId)
			.toString()

		if (meem.meemType === MeemAPI.MeemType.Wrapped) {
			const contract = await services.meem.erc721Contract({
				networkName: MeemAPI.chainToNetworkName(meem.rootChain),
				address: meem.root
			})

			const owner = await contract.ownerOf(
				services.web3.toBigNumber(meem.rootTokenId)
			)

			const meemberOwnedWallet = meemId.wallets.find(
				w => w.toLowerCase() === owner.toLowerCase()
			)

			if (!meemberOwnedWallet) {
				throw new Error('NOT_AUTHORIZED')
			}

			const claimTx = await meemContract[
				'safeTransferFrom(address,address,uint256)'
			](config.MEEM_PROXY_ADDRESS, meemberOwnedWallet, tokenIdNumber.toNumber())

			const receipt = await claimTx.wait()

			const transferEvent = receipt.events?.find(e => e.event === 'Transfer')

			if (transferEvent && transferEvent.args && transferEvent.args[2]) {
				const returnData = {
					tokenId,
					transactionHash: receipt.transactionHash
				}

				log.debug('MEEM TRANSFERRED', returnData)
				// await sockets?.emit({
				// 	subscription: MeemAPI.MeemEvent.MeemTransferred,
				// 	eventName: MeemAPI.MeemEvent.MeemTransferred,
				// 	data: returnData
				// })
				// log.debug(returnData)
			}
		} else if (
			meem.meemType === MeemType.Remix &&
			parentTokenIdString === config.TWITTER_PROJECT_TOKEN_ID
		) {
			const meemData = JSON.parse(meem.data)

			if (!meemData.userId) {
				throw new Error('SERVER_ERROR')
			}

			const ownerTwitterId = meemIdentification?.Twitters?.find(
				t => t.twitterId === meemData.userId
			)

			if (!ownerTwitterId) {
				throw new Error('NOT_AUTHORIZED')
			}

			log.debug(
				`Transferring meem ${tokenIdNumber.toNumber()} from ${
					config.MEEM_PROXY_ADDRESS
				} to ${meemId.defaultWallet}`
			)

			const claimTx = await meemContract[
				'safeTransferFrom(address,address,uint256)'
			](
				config.MEEM_PROXY_ADDRESS,
				meemId.defaultWallet,
				tokenIdNumber.toNumber()
			)

			const receipt = await claimTx.wait()

			const transferEvent = receipt.events?.find(e => e.event === 'Transfer')

			if (transferEvent && transferEvent.args && transferEvent.args[2]) {
				const returnData = {
					tokenId,
					transactionHash: receipt.transactionHash
				}

				log.debug('MEEM TRANSFERRED', returnData)
				// await sockets?.emit({
				// 	subscription: MeemAPI.MeemEvent.MeemTransferred,
				// 	eventName: MeemAPI.MeemEvent.MeemTransferred,
				// 	data: returnData
				// })
				// log.debug(returnData)
			}
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
			if (!parsedData) {
				parsedData = JSON.parse(data)
			}
		} catch (e) {
			log.trace(e)
		}

		return parsedData ?? {}
	}
}
