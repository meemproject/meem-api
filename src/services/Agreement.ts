/* eslint-disable import/no-extraneous-dependencies */
import {
	getCuts,
	IFacetVersion,
	diamondABI,
	getMerkleInfo
} from '@meemproject/meem-contracts'
import { Validator } from '@meemproject/metadata'
// eslint-disable-next-line import/named
import { ethers } from 'ethers'
import _ from 'lodash'
import slug from 'slug'
import { v4 as uuidv4 } from 'uuid'
import GnosisSafeABI from '../abis/GnosisSafe.json'
import type Agreement from '../models/Agreement'
import AgreementWallet from '../models/AgreementWallet'
import Wallet from '../models/Wallet'
import {
	InitParamsStruct,
	Mycontract,
	Mycontract__factory,
	SetRoleItemStruct
} from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import { IAgreementRole } from '../types/shared/meem.shared'

export default class AgreementService {
	public static async generateSlug(options: {
		baseSlug: string
		chainId: number
		depth?: number
	}): Promise<string> {
		const { baseSlug, chainId, depth } = options
		const theSlug = slug(baseSlug, { lower: true })

		try {
			const isAvailable = await this.isSlugAvailable({
				slugToCheck: theSlug,
				chainId
			})
			if (isAvailable) {
				return theSlug
			}
		} catch (e) {
			log.debug(e)
		}

		const newDepth = depth ? depth + 1 : 1

		if (newDepth > 5) {
			return uuidv4()
		}

		try {
			// Slug is not available so try to create one w/ a random number...
			const rand = Math.floor(Math.random() * 10000) + 1
			const randStr = Math.random().toString(36).substring(3)
			const newSlug = `${randStr}-${theSlug}-${rand}`
			const finalSlug = await this.generateSlug({
				baseSlug: newSlug,
				chainId,
				depth: newDepth
			})
			return finalSlug
		} catch (e) {
			log.crit(e)
			return baseSlug
		}
	}

	public static async isSlugAvailable(options: {
		slugToCheck: string
		chainId: number
	}): Promise<boolean> {
		const { slugToCheck, chainId } = options
		const existingSlug = await orm.models.Agreement.findOne({
			where: {
				slug: slugToCheck,
				chainId
			}
		})
		return !existingSlug
	}

	public static async updateAgreement(
		data: MeemAPI.v1.ReInitializeAgreement.IRequestBody & {
			senderWalletAddress: string
			agreementId: string
		}
	) {
		const { senderWalletAddress, agreementId } = data
		const agreementInstance = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreementInstance) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const { wallet, contractInitParams, fullMintPermissions } =
			await this.prepareInitValues({
				...data,
				chainId: agreementInstance.chainId,
				agreement: agreementInstance
			})

		const agreement = Mycontract__factory.connect(
			agreementInstance.address,
			wallet
		)

		const isAdmin = await this.isAgreementAdmin({
			agreementId: agreementInstance.id,
			walletAddress: senderWalletAddress
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		agreementInstance.mintPermissions = fullMintPermissions

		await agreementInstance.save()

		log.debug(contractInitParams)

		// TODO: REMOVE const tx = await services.ethers.runTransaction({
		// 	chainId: agreementInstance.chainId,
		// 	fn: agreement.reinitialize.bind(agreement),
		// 	params: [contractInitParams],
		// 	gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
		// })
		const chainId = agreementInstance.chainId

		const agreementContract = await services.agreement.getAgreementContract({
			chainId,
			address: ethers.constants.AddressZero
		})

		const txId = await services.ethers.queueTransaction({
			chainId,
			functionSignature:
				agreementContract.interface.functions[
					'reinitialize((string,string,string,(address,bytes32,bool)[],uint256,(uint8,address[],uint256,uint256,uint256,uint256,bytes32)[],(address,uint256,address)[],bool))'
				].format(),
			contractAddress: agreement.address,
			inputValues: contractInitParams
		})

		return { txId }
	}

	public static async createAgreement(
		data: MeemAPI.v1.CreateAgreement.IRequestBody & {
			senderWalletAddress: string
		}
	) {
		const { shouldMintTokens, tokenMetadata, members, chainId, metadata } = data

		const [dbContract, bundle] = await Promise.all([
			orm.models.Contract.findOne({
				where: {
					id: config.MEEM_PROXY_CONTRACT_ID
				}
			}),
			orm.models.Bundle.findOne({
				where: {
					id: config.MEEM_BUNDLE_ID
				},
				include: [
					{
						model: orm.models.BundleContract,
						include: [
							{
								model: orm.models.Contract,
								include: [
									{
										model: orm.models.ContractInstance,
										where: {
											chainId
										}
									}
								]
							}
						]
					}
				]
			})
		])

		if (!dbContract) {
			throw new Error('CONTRACT_NOT_FOUND')
		}

		if (!bundle) {
			throw new Error('BUNDLE_NOT_FOUND')
		}

		// Validate metadata
		const contractMetadataValidator = new Validator(metadata)
		const contractMetadataValidatorResult =
			contractMetadataValidator.validate(metadata)

		if (!contractMetadataValidatorResult.valid) {
			log.crit(
				contractMetadataValidatorResult.errors.map((e: any) => e.message)
			)
			throw new Error('INVALID_METADATA')
		}

		const { wallet, senderWallet, contractInitParams, cleanAdmins } =
			await this.prepareInitValues({ ...data, chainId })

		const builtData: {
			to: string
			metadata: MeemAPI.IMeemMetadataLike
			ipfs?: string
		}[] = []

		if (shouldMintTokens && tokenMetadata) {
			const addresses = [...cleanAdmins.map(a => a.user), ...(members ?? [])]

			const tokens = addresses.map(a => {
				return {
					to: a,
					metadata: tokenMetadata
				}
			})

			// Validate metadata
			tokens.forEach(token => {
				if (!token.to) {
					throw new Error('MISSING_ACCOUNT_ADDRESS')
				}

				if (!token.metadata) {
					throw new Error('INVALID_METADATA')
				}

				const validator = new Validator(token.metadata)
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
		}

		const deployContractTxId = await services.ethers.queueContractDeployment({
			chainId,
			abi: dbContract.abi,
			bytecode: dbContract.bytecode,
			args: [senderWallet.address, [senderWallet.address, wallet.address]]
		})

		const toVersion: IFacetVersion[] = []

		bundle.BundleContracts?.forEach(bc => {
			const contractInstance =
				bc.Contract?.ContractInstances && bc.Contract?.ContractInstances[0]
			if (!contractInstance) {
				throw new Error('FACET_NOT_DEPLOYED')
			}

			toVersion.push({
				address: contractInstance.address,
				functionSelectors: bc.functionSelectors
			})
		})

		const iFace = new ethers.utils.Interface(bundle.abi)

		const functionCall = iFace.encodeFunctionData('initialize', [
			contractInitParams
		])

		const cutTxId = await services.ethers.queueDiamondCut({
			chainId,
			contractTxId: deployContractTxId,
			fromVersion: [],
			toVersion,
			functionCall,
			abi: dbContract.abi
		})

		let mintTxId

		if (shouldMintTokens && tokenMetadata) {
			const agreementContract = await services.agreement.getAgreementContract({
				chainId,
				address: ethers.constants.AddressZero
			})

			// Pin to IPFS
			for (let i = 0; i < builtData.length; i++) {
				const item = builtData[i]
				const result = await services.web3.saveToPinata({
					json: { ...item.metadata }
				})
				item.ipfs = `ipfs://${result.IpfsHash}`
			}

			const bulkParams: Parameters<Mycontract['bulkMint']>[0] = builtData.map(
				item => ({
					to: item.to,
					tokenType: MeemAPI.MeemType.Original,
					tokenURI: item.ipfs as string
				})
			)

			mintTxId = await services.ethers.queueTransaction({
				chainId,
				functionSignature:
					agreementContract.interface.functions[
						'bulkMint((address,string,uint8)[])'
					].format(),
				contractTxId: deployContractTxId,
				inputValues: {
					bulkParams
				}
			})
		}

		return {
			deployContractTxId,
			cutTxId,
			mintTxId
		}
	}

	public static async prepareInitValues(
		data: Omit<
			MeemAPI.v1.ReInitializeAgreement.IRequestBody,
			'merkleRoot' | 'mintPermissions'
		> & {
			mintPermissions?: Omit<MeemAPI.IMeemPermission, 'merkleRoot'>[]
			chainId: number
			senderWalletAddress: string
			agreement?: Agreement
			shouldMintTokens?: boolean
			tokenMetadata?: MeemAPI.IMeemMetadataLike
		}
	) {
		const {
			mintPermissions,
			splits,
			isTransferLocked,
			tokenMetadata,
			senderWalletAddress,
			chainId,
			agreement
		} = data

		let senderWallet = await orm.models.Wallet.findByAddress<Wallet>(
			senderWalletAddress
		)
		if (!senderWallet) {
			senderWallet = await orm.models.Wallet.create({
				address: senderWalletAddress
			})
			await services.meemId.createOrUpdateUser({
				wallet: senderWallet
			})
		}

		let { metadata, symbol, name, maxSupply } = data

		if (!symbol && !agreement && name) {
			symbol = slug(name, { lower: true })
		} else if (agreement) {
			symbol = agreement.symbol
		}

		if (!name && agreement) {
			name = agreement.name
		}

		if (!maxSupply && agreement) {
			maxSupply = agreement.maxSupply
		}

		if (!symbol || !name || !maxSupply) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!metadata && agreement) {
			metadata = agreement.metadata
		}

		const admins = data.admins ?? []
		const minters = data.minters ?? []

		if (!metadata?.meem_metadata_version) {
			throw new Error('INVALID_METADATA')
		}

		const contractMetadataValidator = new Validator(metadata)
		const contractMetadataValidatorResult =
			contractMetadataValidator.validate(metadata)

		if (!contractMetadataValidatorResult.valid) {
			log.crit(
				contractMetadataValidatorResult.errors.map((e: any) => e.message)
			)
			throw new Error('INVALID_METADATA')
		}

		if (data.shouldMintTokens && tokenMetadata) {
			const tokenMetadataValidator = new Validator(tokenMetadata)
			const tokenMetadataValidatorResult =
				tokenMetadataValidator.validate(tokenMetadata)

			if (!tokenMetadataValidatorResult.valid) {
				log.crit(tokenMetadataValidatorResult.errors.map((e: any) => e.message))
				throw new Error('INVALID_METADATA')
			}
		}

		const result = await services.web3.saveToPinata({
			json: {
				...metadata
			}
		})
		const { provider, wallet } = await services.ethers.getProvider({
			chainId
		})

		const uri = `ipfs://${result.IpfsHash}`

		const agreementAdmins: AgreementWallet[] = []
		const agreementMinters: AgreementWallet[] = []
		let agreementWallets: AgreementWallet[] = []

		if (agreement) {
			agreementWallets = await orm.models.AgreementWallet.findAll({
				where: {
					AgreementId: agreement.id
				},
				include: [orm.models.Wallet]
			})

			agreementWallets.forEach(w => {
				if (w.role === config.ADMIN_ROLE) {
					agreementAdmins.push(w)
				} else if (w.role === config.MINTER_ROLE) {
					agreementMinters.push(w)
				}
			})
		}

		const cleanAdmins = _.uniqBy(
			[...admins, wallet.address.toLowerCase()],
			a => a && a.toLowerCase()
		).map(a => ({
			role: config.ADMIN_ROLE,
			user: ethers.utils.getAddress(a),
			hasRole: true
		}))

		const cleanMinters = _.uniqBy(
			[...minters, wallet.address.toLowerCase()],
			a => a && a.toLowerCase()
		).map(a => ({
			role: config.MINTER_ROLE,
			user: ethers.utils.getAddress(a),
			hasRole: true
		}))

		const agreementWalletIdsToRemove: string[] = []
		const roles: SetRoleItemStruct[] = []

		// Find roles to remove
		agreementWallets.forEach(agreementWallet => {
			let foundItem: SetRoleItemStruct | undefined

			if (agreementWallet.role === config.ADMIN_ROLE) {
				foundItem = cleanAdmins.find(
					c =>
						c.user.toLowerCase() ===
						agreementWallet.Wallet?.address.toLowerCase()
				)
			} else if (agreementWallet.role === config.MINTER_ROLE) {
				foundItem = cleanMinters.find(
					c =>
						c.user.toLowerCase() ===
						agreementWallet.Wallet?.address.toLowerCase()
				)
			}

			if (!foundItem && agreementWallet.Wallet) {
				roles.push({
					role: agreementWallet.role,
					user: agreementWallet.Wallet.address,
					hasRole: false
				})

				agreementWalletIdsToRemove.push(agreementWallet.id)
			}
		})

		// Find roles to add
		cleanAdmins.forEach(adminItem => {
			const existingAdmin = agreementAdmins.find(
				a => a.Wallet?.address.toLowerCase() === adminItem.user.toLowerCase()
			)
			if (!existingAdmin) {
				roles.push(adminItem)
			}
		})

		cleanMinters.forEach(minterItem => {
			const existingAdmin = agreementMinters.find(
				a => a.Wallet?.address.toLowerCase() === minterItem.user.toLowerCase()
			)
			if (!existingAdmin) {
				roles.push(minterItem)
			}
		})

		// Build mint permissions
		const builtMintPermissions: MeemAPI.IMeemPermission[] = []
		const fullMintPermissions: MeemAPI.IMeemPermission[] = []

		if (mintPermissions) {
			mintPermissions.forEach(m => {
				if (m.permission === MeemAPI.Permission.Addresses) {
					const { rootHash } = getMerkleInfo({ addresses: m.addresses })
					const perm = {
						...m,
						merkleRoot: rootHash
					}
					builtMintPermissions.push({ ...perm, addresses: [] })
					fullMintPermissions.push(perm)
				} else {
					const perm = {
						...m,
						merkleRoot: ethers.utils.formatBytes32String('')
					}
					builtMintPermissions.push(perm)
					fullMintPermissions.push(perm)
				}
			})
		}

		const contractInitParams: InitParamsStruct = {
			symbol,
			name,
			contractURI: uri,
			roles: [
				...roles,
				// Give ourselves the upgrader role by default
				{
					role: config.UPGRADER_ROLE,
					user: wallet.address,
					hasRole: true
				}
			],
			maxSupply,
			mintPermissions: builtMintPermissions,
			splits: splits ?? [],
			isTransferLocked: isTransferLocked ?? false
		}

		return {
			provider,
			wallet,
			contractInitParams,
			senderWallet,
			cleanAdmins,
			fullMintPermissions,
			builtMintPermissions
		}
	}

	/** Mint an Agreement Token */
	public static async bulkMint(
		data: MeemAPI.v1.BulkMintAgreementTokens.IRequestBody & {
			mintedBy: string
			agreementId: string
		}
	) {
		if (!data.agreementId) {
			throw new Error('MISSING_CONTRACT_ADDRESS')
		}

		const [agreement, minterWallet] = await Promise.all([
			orm.models.Agreement.findOne({
				where: {
					id: data.agreementId
				}
			}),
			orm.models.Wallet.findByAddress<Wallet>(data.mintedBy)
		])

		if (!minterWallet) {
			throw new Error('WALLET_NOT_FOUND')
		}

		if (!agreement) {
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

			if (!token.metadata) {
				throw new Error('INVALID_METADATA')
			}

			const validator = new Validator({
				meem_metadata_type: 'Meem_AgreementToken',
				meem_metadata_version: token.metadata.meem_metadata_version
			})
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
				json: { ...item.metadata }
			})
			item.ipfs = `ipfs://${result.IpfsHash}`
		}

		const bulkParams: Parameters<Mycontract['bulkMint']>[0] = builtData.map(
			item => ({
				to: item.to,
				tokenType: MeemAPI.MeemType.Original,
				tokenURI: item.ipfs as string
			})
		)

		log.debug('Bulk Minting meem w/ params', { bulkParams })

		// const mintTx = await services.ethers.runTransaction({
		// 	chainId: agreement.chainId,
		// 	fn: contract.bulkMint.bind(contract),
		// 	params: mintParams,
		// 	gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
		// })

		const chainId = agreement.chainId

		const agreementContract = await services.agreement.getAgreementContract({
			chainId,
			address: ethers.constants.AddressZero
		})

		const txId = await services.ethers.queueTransaction({
			chainId,
			functionSignature:
				agreementContract.interface.functions[
					'bulkMint((address,string,uint8)[])'
				].format(),
			contractAddress: agreement.address,
			inputValues: {
				bulkParams
			}
		})

		return { txId }
	}

	// Adapted from https://forum.openzeppelin.com/t/creating-gnosis-safes-via-the-api/12031/2
	// Gnosis safe deployments / abi: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/gnosis_safe.json
	// Gnosis proxy factory deployments / abi: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/proxy_factory.json
	public static async createAgreementSafe(
		options: MeemAPI.v1.CreateAgreementSafe.IRequestBody & {
			agreementId: string
			senderWalletAddress: string
		}
	) {
		const { agreementId, safeOwners, senderWalletAddress, chainId } = options
		const [agreement, senderWallet] = await Promise.all([
			orm.models.Agreement.findOne({
				where: {
					id: agreementId
				}
			}),
			orm.models.Wallet.findByAddress<Wallet>(senderWalletAddress)
		])

		if (!senderWallet) {
			throw new Error('WALLET_NOT_FOUND')
		}

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (agreement.gnosisSafeAddress) {
			throw new Error('CLUB_SAFE_ALREADY_EXISTS')
		}

		const isAdmin = await this.isAgreementAdmin({
			agreementId: agreement.id,
			walletAddress: senderWalletAddress
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		// This is one of the topics emitted when a gnosis safe is created
		// const topic =
		// 	'0x141df868a6331af528e38c83b7aa03edc19be66e37ae67f9285bf4f8e3c6a1a8'

		const threshold = options.threshold ?? 1

		const gnosisInterface = new ethers.utils.Interface(GnosisSafeABI)
		const safeSetupData = gnosisInterface.encodeFunctionData('setup', [
			// Owners
			safeOwners,
			// Threshold of signers
			threshold,
			// to
			'0x0000000000000000000000000000000000000000',
			// data
			'0x',
			// Fallback handler
			config.GNOSIS_DEFAULT_CALLBACK_HANDLER,
			// Payment token
			'0x0000000000000000000000000000000000000000',
			// Payment
			'0',
			// Payment receiver
			'0x0000000000000000000000000000000000000000'
		])

		// const tx = await services.ethers.runTransaction({
		// 	chainId,
		// 	fn: proxyContract.createProxy.bind(proxyContract),
		// 	params: [config.GNOSIS_MASTER_CONTRACT_ADDRESS, safeSetupData],
		// 	gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
		// })

		const txId = await services.ethers.queueTransaction({
			chainId,
			functionSignature: 'createProxy(address, bytes)',
			contractAddress: config.GNOSIS_MASTER_CONTRACT_ADDRESS,
			inputValues: {
				address: config.GNOSIS_MASTER_CONTRACT_ADDRESS,
				data: safeSetupData
			}
		})

		// TODO: Need to find this via event created or save in queue handler
		// const receipt = await provider.core.getTransactionReceipt(tx.hash)

		// if (receipt) {
		// 	// Find the newly created Safe contract address in the transaction receipt
		// 	for (let i = 0; i < receipt.logs.length; i += 1) {
		// 		const receiptLog = receipt.logs[i]
		// 		const foundTopic = receiptLog.topics.find(t => t === topic)
		// 		if (foundTopic) {
		// 			log.info(`address: ${receiptLog.address}`)
		// 			agreement.gnosisSafeAddress = receiptLog.address
		// 			break
		// 		}
		// 	}
		// }

		// await agreement.save()
		return { txId }
	}

	public static async upgradeAgreement(
		options: MeemAPI.v1.UpgradeAgreement.IRequestBody & {
			agreementId: string
			senderWalletAddress: string
		}
	) {
		const { agreementId, senderWalletAddress } = options
		const [agreement, senderWallet] = await Promise.all([
			orm.models.Agreement.findOne({
				where: {
					id: agreementId
				},
				include: [orm.models.Wallet]
			}),

			orm.models.Wallet.findByAddress<Wallet>(senderWalletAddress)
		])

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (!senderWallet) {
			throw new Error('WALLET_NOT_FOUND')
		}

		const [bundle, isAdmin] = await Promise.all([
			orm.models.Bundle.findOne({
				where: {
					id: config.MEEM_BUNDLE_ID
				},
				include: [
					{
						model: orm.models.BundleContract,
						include: [
							{
								model: orm.models.Contract,
								include: [
									{
										model: orm.models.ContractInstance,
										where: {
											chainId: agreement.chainId
										}
									}
								]
							}
						]
					}
				]
			}),
			this.isAgreementAdmin({
				agreementId: agreement.id,
				walletAddress: senderWalletAddress
			})
		])

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const fromVersion: IFacetVersion[] = []
		const toVersion: IFacetVersion[] = []

		const { wallet } = await services.ethers.getProvider({
			chainId: agreement.chainId
		})

		const diamond = new ethers.Contract(agreement.address, diamondABI, wallet)

		const facets = await diamond.facets()
		facets.forEach((facet: { target: string; selectors: string[] }) => {
			fromVersion.push({
				address: facet.target,
				functionSelectors: facet.selectors
			})
		})

		bundle?.BundleContracts?.forEach(bc => {
			if (
				!bc.Contract?.ContractInstances ||
				!bc.Contract?.ContractInstances[0]
			) {
				throw new Error('CONTRACT_INSTANCE_NOT_FOUND')
			}
			toVersion.push({
				address: bc.Contract.ContractInstances[0].address,
				functionSelectors: bc.functionSelectors
			})
		})
		// const tx = await upgrade({
		// 	signer,
		// 	proxyContractAddress: agreement.address,
		// 	toVersion,
		// 	fromVersion,
		// 	overrides: {
		// 		gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
		// 	}
		// })
		const cuts = getCuts({
			proxyContractAddress: agreement.address,
			toVersion,
			fromVersion
		})

		if (cuts.length === 0) {
			throw new Error('CONTRACT_ALREADY_UP_TO_DATE')
		}

		const txId = await services.ethers.queueTransaction({
			chainId: agreement.chainId,
			functionSignature:
				'diamondCut((address, uint8, bytes4[])[], address, bytes)',
			contractAddress: agreement.address,
			inputValues: {
				_diamondCut: cuts,
				_init: ethers.constants.AddressZero,
				_calldata: '0x'
			}
		})

		return { txId }
	}

	public static async isAgreementAdmin(options: {
		agreementId: string
		walletAddress: string
	}) {
		const { agreementId, walletAddress } = options
		const agreementWallet = await orm.models.AgreementWallet.findOne({
			where: {
				role: config.ADMIN_ROLE,
				AgreementId: agreementId
			},
			include: [
				{
					model: orm.models.Wallet,
					where: orm.sequelize.where(
						orm.sequelize.fn('lower', orm.sequelize.col('address')),
						walletAddress.toLowerCase()
					)
				}
			]
		})

		if (agreementWallet) {
			return true
		}

		return false
	}

	public static async getAgreementRoles(options: {
		agreementId: string
		agreementRoleId?: string
	}): Promise<IAgreementRole[]> {
		const { agreementId, agreementRoleId } = options
		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			},
			include: [
				{
					model: orm.models.AgreementRole,
					...(agreementRoleId && {
						where: {
							id: agreementRoleId
						}
					})
				}
			]
		})

		const agreementRoles = agreement?.AgreementRoles ?? []

		if (!agreement) {
			throw new Error('SERVER_ERROR')
		}

		const roles: IAgreementRole[] = await Promise.all(
			agreementRoles.map(async mcRole => {
				const role: any = mcRole.toJSON()

				// if (mcRole.guildRoleId) {
				// 	const guildRoleResponse = await guildRole.get(mcRole.guildRoleId)

				// 	role.guildRole = guildRoleResponse

				// 	if (agreementRoleId) {
				// 		role.members = await Promise.all(
				// 			(role.guildRole?.members ?? []).map((m: string) =>
				// 				services.meemId.getMeemIdentityForAddress(m)
				// 			)
				// 		)
				// 	}
				// }
				return role
			})
		)

		return roles
	}

	// public static async getUserAgreementRolesAccess(options: {
	// 	agreementId: string
	// 	walletAddress: string
	// 	agreementRoleId?: string
	// }): Promise<{
	// 	hasRolesAccess: boolean
	// 	roles: IAgreementRole[]
	// }> {
	// const { agreementId, walletAddress, agreementRoleId } = options
	// const meemIdentity = await orm.models.User.findOne({
	// 	include: [
	// 		{
	// 			model: orm.models.Wallet,
	// 			where: {
	// 				address: walletAddress
	// 			},
	// 			attributes: ['id', 'address', 'ens'],
	// 			through: {
	// 				attributes: []
	// 			}
	// 		},
	// 		{
	// 			model: orm.models.Wallet,
	// 			as: 'DefaultWallet',
	// 			attributes: ['id', 'address', 'ens']
	// 		}
	// 	]
	// })
	// if (!meemIdentity) {
	// 	log.crit('MeemIdentity not found')
	// 	throw new Error('SERVER_ERROR')
	// }
	// const agreement = await orm.models.Agreement.findOne({
	// 	where: {
	// 		id: agreementId
	// 	},
	// 	include: [
	// 		{
	// 			model: orm.models.AgreementGuild
	// 		},
	// 		{
	// 			model: orm.models.AgreementRole,
	// 			...(agreementRoleId && {
	// 				where: {
	// 					id: agreementRoleId
	// 				}
	// 			}),
	// 			include: [
	// 				{
	// 					model: orm.models.RolePermission,
	// 					attributes: ['id'],
	// 					through: {
	// 						attributes: []
	// 					}
	// 				}
	// 			]
	// 		}
	// 	]
	// })
	// const agreementRoles = agreement?.AgreementRoles ?? []
	// if (!agreement || !agreement.AgreementGuild) {
	// 	throw new Error('SERVER_ERROR')
	// }
	// const guildUserMembershipResponse = await guild.getUserMemberships(
	// 	agreement.AgreementGuild.guildId,
	// 	walletAddress
	// )
	// const rolesIdsWithAccess = guildUserMembershipResponse
	// 	.filter(r => r.access)
	// 	.map(r => r.roleId)
	// if (rolesIdsWithAccess.length < 1) {
	// 	return {
	// 		hasRolesAccess: false,
	// 		roles: []
	// 	}
	// }
	// let roles: IAgreementRole[] = await Promise.all(
	// 	agreementRoles.map(async mcRole => {
	// 		const role: any = mcRole.toJSON()
	// 		return role
	// 	})
	// )
	// roles = roles.filter((r: IAgreementRole) => {
	// 	if (!r.guildRoleId && !r.guildRole) {
	// 		return false
	// 	}
	// 	return r.guildRole.members.includes(walletAddress)
	// })
	// return {
	// 	hasRolesAccess: true,
	// 	roles
	// }
	// }

	public static async updateAgreementAdmins(options: {
		agreementId: string
		admins: string[]
		senderWallet: Wallet
	}) {
		const { agreementId, admins, senderWallet } = options

		const isAdmin = await this.isAgreementAdmin({
			agreementId,
			walletAddress: senderWallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			},
			include: [
				{
					model: orm.models.AgreementRole
				}
			]
		})

		if (!agreement) {
			throw new Error('SERVER_ERROR')
		}

		const { wallet } = await services.ethers.getProvider({
			chainId: agreement.chainId
		})

		// TODO: Allow removal of Meem address
		const cleanAdmins = _.uniqBy(
			[...admins, wallet.address.toLowerCase()],
			a => a && a.toLowerCase()
		).map(a => ({
			role: config.ADMIN_ROLE,
			user: a,
			hasRole: true
		}))

		if (cleanAdmins.length > 0) {
			throw new Error('NO_ADMIN_CHANGES')
		}

		const chainId = agreement.chainId

		const agreementContract = await services.agreement.getAgreementContract({
			chainId,
			address: ethers.constants.AddressZero
		})

		const txId = await services.ethers.queueTransaction({
			chainId,
			functionSignature:
				agreementContract.interface.functions[
					'bulkSetRoles((address,bytes32,bool)[])'
				].format(),
			contractAddress: agreement.address,
			inputValues: {
				items: cleanAdmins
			}
		})

		return { txId }
	}

	public static async getAgreementContract(options: {
		address: string
		chainId: number
	}): Promise<Mycontract> {
		const { address, chainId } = options
		const { wallet } = await services.ethers.getProvider({
			chainId
		})

		const contract = Mycontract__factory.connect(address, wallet)

		return contract
	}
}
