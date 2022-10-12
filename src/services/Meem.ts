import * as path from 'path'
import { Validator } from '@meemproject/metadata'
import { ethers as Ethers } from 'ethers'
import _ from 'lodash'
import sharp from 'sharp'
import request from 'superagent'
import { v4 as uuidv4 } from 'uuid'
import ERC721ABI from '../abis/ERC721.json'
import meemABI from '../abis/Meem.json'
import errors from '../config/errors'
import meemAccessListTesting from '../lib/meem-access-testing.json'
import meemAccessList from '../lib/meem-access.json'
import Wallet from '../models/Wallet'
import { ERC721 } from '../types/ERC721'
import { Mycontract } from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import { MeemMetadataStorageProvider } from '../types/shared/meem.shared'

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
		code: errorKey,
		status: 'failure',
		httpCode: 500,
		reason: err.reason,
		friendlyReason: err.friendlyReason
	}
}

export default class MeemService {
	/** Get generic ERC721 contract instance */
	public static async erc721Contract(options: {
		networkName?: MeemAPI.NetworkName
		address: string
	}) {
		const ethers = services.ethers.getInstance()
		const { networkName, address } = options
		const provider = await services.ethers.getProvider({
			chainId: MeemAPI.networkNameToChain(
				networkName ?? MeemAPI.NetworkName.Mainnet
			)
		})

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

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
	public static async getMeemContract(options: {
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

		const walletPrivateKey =
			options?.walletPrivateKey ?? config.WALLET_PRIVATE_KEY

		const provider = await services.ethers.getProvider({
			chainId
		})

		const wallet = new ethers.Wallet(walletPrivateKey, provider)

		const meemContract = new ethers.Contract(
			address,
			meemABI,
			wallet
		) as unknown as Mycontract

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
	public static async mintOriginalMeem(
		data: MeemAPI.v1.MintOriginalMeem.IRequestBody & {
			mintedBy: string
		}
	): Promise<{
		toAddress: string
		tokenURI: string
		tokenId: number
		transactionHash: string
	}> {
		try {
			if (!data.meemContractAddress) {
				throw new Error('MISSING_CONTRACT_ADDRESS')
			}

			if (!data.to) {
				throw new Error('MISSING_ACCOUNT_ADDRESS')
			}

			if (!data.metadata?.meem_metadata_version) {
				throw new Error('INVALID_METADATA')
			}

			const wallet = await orm.models.Wallet.findByAddress<Wallet>(
				data.mintedBy
			)

			if (!wallet) {
				throw new Error('WALLET_NOT_FOUND')
			}

			const validator = new Validator(data.metadata.meem_metadata_version)
			const validatorResult = validator.validate(data.metadata)

			if (!validatorResult.valid) {
				log.crit(validatorResult.errors.map((e: any) => e.message))
				throw new Error('INVALID_METADATA')
			}

			const meemContract = await this.getMeemContract({
				address: data.meemContractAddress.toLowerCase(),
				chainId: data.chainId
			})

			const result = await services.web3.saveToPinata({
				json: data.metadata
			})

			const tokenURI = `ipfs://${result.IpfsHash}`

			const mintParams: Parameters<Mycontract['mintWithProof']> = [
				{
					to: data.to.toLowerCase(),
					tokenURI,
					tokenType: MeemAPI.MeemType.Original,
					proof: []
				}
			]

			log.debug('Minting meem w/ params', { mintParams })

			// const mintTx = await meemContract.mint(...mintParams)
			const mintTx = await services.ethers.runTransaction({
				chainId: data.chainId,
				fn: meemContract.mint.bind(meemContract),
				params: mintParams,
				gasLimit: Ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			log.debug(`Minting w/ transaction hash: ${mintTx.hash}`)

			await orm.models.Transaction.create({
				hash: mintTx.hash,
				chainId: data.chainId,
				WalletId: wallet.id
			})

			const receipt = await mintTx.wait()

			const transferEvent = receipt.events?.find(e => e.event === 'Transfer')

			if (transferEvent && transferEvent.args && transferEvent.args[2]) {
				const tokenId = (transferEvent.args[2] as Ethers.BigNumber).toNumber()
				const returnData = {
					toAddress: data.to.toLowerCase(),
					tokenURI: 'TODO: tokenURI is base64 encoded JSON',
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

			log.warn(err, data)

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
					log.crit('Unable to parse error.')
				}
				const error = handleStringErrorKey(errStr)
				await sockets?.emitError(error, data.to)
				throw new Error(errStr)
			}
			if (err.message) {
				const error = handleStringErrorKey(err.message)
				await sockets?.emitError(error, data.to)
				throw new Error(err.message)
			}
			await sockets?.emitError(errors.SERVER_ERROR, data.to)
			throw new Error('SERVER_ERROR')
		}
	}

	/** Mint a Meem */
	public static async bulkMint(
		data: MeemAPI.v1.BulkMint.IRequestBody & {
			mintedBy: string
			meemContractId: string
		}
	) {
		try {
			if (!data.meemContractId) {
				throw new Error('MISSING_CONTRACT_ADDRESS')
			}

			const [meemContract, wallet] = await Promise.all([
				orm.models.MeemContract.findOne({
					where: {
						id: data.meemContractId
					}
				}),
				orm.models.Wallet.findByAddress<Wallet>(data.mintedBy)
			])

			if (!wallet) {
				throw new Error('WALLET_NOT_FOUND')
			}

			if (!meemContract) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}

			const builtData: {
				to: string
				metadata: MeemAPI.IMeemMetadataLike
				ipfs?: string
			}[] = []

			// Validate metadata
			data.tokens.forEach(token => {
				if (!token.to) {
					throw new Error('MISSING_ACCOUNT_ADDRESS')
				}

				if (!token.metadata?.meem_metadata_version) {
					throw new Error('INVALID_METADATA')
				}

				const validator = new Validator(token.metadata.meem_metadata_version)
				const validatorResult = validator.validate(token.metadata)

				if (!validatorResult.valid) {
					log.crit(validatorResult.errors.map((e: any) => e.message))
					throw new Error('INVALID_METADATA')
				}

				builtData.push({
					...token,
					metadata: token.metadata
				})
			})

			// Pin to IPFS
			for (let i = 0; i < builtData.length; i++) {
				const item = builtData[i]
				const result = await services.web3.saveToPinata({
					json: item.metadata
				})
				item.ipfs = `ipfs://${result.IpfsHash}`
			}

			const contract = await this.getMeemContract({
				address: meemContract.address,
				chainId: meemContract.chainId
			})

			const mintParams: Parameters<Mycontract['bulkMint']> = [
				builtData.map(item => ({
					to: item.to,
					tokenType: MeemAPI.MeemType.Original,
					tokenURI: item.ipfs as string
				}))
			]

			log.debug('Bulk Minting meem w/ params', { mintParams })

			const mintTx = await services.ethers.runTransaction({
				chainId: meemContract.chainId,
				fn: contract.bulkMint.bind(contract),
				params: mintParams,
				gasLimit: Ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			log.debug(`Bulk Minting w/ transaction hash: ${mintTx.hash}`)

			await orm.models.Transaction.create({
				hash: mintTx.hash,
				chainId: meemContract.chainId,
				WalletId: wallet.id
			})

			await mintTx.wait()
		} catch (e) {
			const err = e as any
			log.warn(err, data)

			await sockets?.emitError(errors.SERVER_ERROR, data.mintedBy)
			throw new Error('SERVER_ERROR')
		}
	}

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
			const meemContract = await this.getMeemContract({
				address: contractAddress,
				chainId
			})
			// const meem = await meemContract.getMeem(tokenId)
			// rootTokenAddress = meem.root
			// rootTokenId = meem.rootTokenId

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
