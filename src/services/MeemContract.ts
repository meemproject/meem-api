/* eslint-disable import/no-extraneous-dependencies */
import { guild, role as guildRole } from '@guildxyz/sdk'
import {
	getCuts,
	IFacetVersion,
	diamondABI,
	getMerkleInfo
} from '@meemproject/meem-contracts'
import { Validator } from '@meemproject/metadata'
import AWS from 'aws-sdk'
// eslint-disable-next-line import/named
import { Bytes, ethers } from 'ethers'
import _ from 'lodash'
import slug from 'slug'
import { v4 as uuidv4 } from 'uuid'
import GnosisSafeABI from '../abis/GnosisSafe.json'
import GnosisSafeProxyABI from '../abis/GnosisSafeProxy.json'
import IDiamondCut from '../lib/IDiamondCut'
import type MeemContract from '../models/MeemContract'
import MeemContractGuild from '../models/MeemContractGuild'
import MeemContractWallet from '../models/MeemContractWallet'
import RolePermission from '../models/RolePermission'
import Wallet from '../models/Wallet'
import {
	InitParamsStruct,
	Mycontract,
	Mycontract__factory,
	SetRoleItemStruct
} from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import { IMeemContractRole } from '../types/shared/meem.shared'

export default class MeemContractService {
	public static async generateSlug(options: {
		baseSlug: string
		chainId: number
		depth?: number
	}): Promise<string> {
		const { baseSlug, chainId, depth } = options
		// TODO: 🚨 Figure out what to do with slugs. Do all contract types need slugs?
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
			throw new Error('INVALID_SLUG')
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
		const existingSlug = await orm.models.MeemContract.findOne({
			where: {
				slug: slugToCheck,
				chainId
			}
		})
		return !existingSlug
	}

	public static async updateMeemContract(
		data: MeemAPI.v1.ReInitializeMeemContract.IRequestBody & {
			senderWalletAddress: string
			meemContractId: string
		}
	): Promise<string> {
		const { senderWalletAddress, meemContractId } = data
		try {
			const meemContractInstance = await orm.models.MeemContract.findOne({
				where: {
					id: meemContractId
				}
			})

			if (!meemContractInstance) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}

			const { wallet, contractInitParams, fullMintPermissions, senderWallet } =
				await this.prepareInitValues({
					...data,
					chainId: meemContractInstance.chainId,
					meemContract: meemContractInstance
				})

			const meemContract = Mycontract__factory.connect(
				meemContractInstance.address,
				wallet
			)

			const isAdmin = await this.isMeemContractAdmin({
				meemContractId: meemContractInstance.id,
				walletAddress: senderWalletAddress
			})

			if (!isAdmin) {
				throw new Error('NOT_AUTHORIZED')
			}

			meemContractInstance.mintPermissions = fullMintPermissions

			log.debug(contractInitParams)

			const tx = await services.ethers.runTransaction({
				chainId: meemContractInstance.chainId,
				fn: meemContract.reinitialize.bind(meemContract),
				params: [contractInitParams],
				gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			await orm.models.Transaction.create({
				hash: tx.hash,
				chainId: meemContractInstance.chainId,
				WalletId: senderWallet.id
			})

			await meemContractInstance.save()

			log.debug(`Reinitialize tx: ${tx.hash}`)

			await tx.wait()

			return meemContract.address
		} catch (e: any) {
			log.crit(e)
			await sockets?.emitError(
				e?.message ?? config.errors.CONTRACT_UPDATE_FAILED,
				senderWalletAddress
			)
			throw new Error('CONTRACT_UPDATE_FAILED')
		}
	}

	public static async createMeemContract(
		data: MeemAPI.v1.CreateMeemContract.IRequestBody & {
			senderWalletAddress: string
			meemContractRoleData?: {
				name: string
				meemContract: MeemContract
				meemContractGuild: MeemContractGuild
				permissions?: string[]
				isAdminRole?: boolean
			}
		}
	): Promise<MeemContract> {
		const {
			shouldMintTokens,
			tokenMetadata,
			members,
			senderWalletAddress,
			chainId
		} = data

		try {
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

			const {
				wallet,
				senderWallet,
				contractInitParams,
				cleanAdmins,
				fullMintPermissions
			} = await this.prepareInitValues({ ...data, chainId })

			const proxyContractFactory = new ethers.ContractFactory(
				dbContract.abi,
				{
					object: dbContract.bytecode
				},
				wallet
			)

			const proxyContract = await services.ethers.runTransaction({
				chainId,
				fn: proxyContractFactory.deploy.bind(proxyContractFactory),
				params: [senderWallet.address, [senderWallet.address, wallet.address]],
				gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			log.debug(
				`Deploying contract w/ tx: ${proxyContract.deployTransaction.hash}`
			)

			await orm.models.Transaction.create({
				hash: proxyContract.deployTransaction.hash,
				chainId,
				WalletId: senderWallet.id
			})

			await proxyContract.deployed()

			log.debug(
				`Deployed proxy at ${proxyContract.address} w/ tx: ${proxyContract.deployTransaction.hash}`
			)

			const meemContract = Mycontract__factory.connect(
				proxyContract.address,
				wallet
			)

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

			const cuts = getCuts({
				proxyContractAddress: proxyContract.address,
				fromVersion: [],
				toVersion
			})

			const iFace = new ethers.utils.Interface(bundle.abi)

			const functionCall = iFace.encodeFunctionData('initialize', [
				contractInitParams
			])

			log.debug(contractInitParams)

			const facetCuts = cuts.map(c => ({
				target: c.facetAddress,
				action: c.action,
				selectors: c.functionSelectors
			}))

			let contractSlug = uuidv4()

			if (data.name) {
				try {
					contractSlug = await services.meemContract.generateSlug({
						baseSlug: data.name,
						chainId
					})
				} catch (e) {
					log.crit('Something went wrong while creating slug', e)
				}
			}

			const meemContractInstance = await orm.models.MeemContract.create({
				address: proxyContract.address,
				mintPermissions: fullMintPermissions,
				slug: contractSlug,
				name: data.name,
				type: data.metadata.meem_contract_type ?? '',
				isTransferrable: !data.isTransferLocked,
				chainId
			})

			const cutTx = await services.ethers.runTransaction({
				chainId,
				fn: proxyContract.diamondCut.bind(proxyContract),
				params: [facetCuts, proxyContract.address, functionCall],
				gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			log.debug(`Running diamond cut w/ TX: ${cutTx.hash}`)

			await orm.models.Transaction.create({
				hash: cutTx.hash,
				chainId,
				WalletId: senderWallet.id
			})

			await cutTx.wait()

			if (shouldMintTokens && tokenMetadata) {
				log.debug(`Minting admin/member tokens.`, cleanAdmins)
				const addresses = [...cleanAdmins.map(a => a.user), ...(members ?? [])]

				const tokens = addresses.map(a => {
					return {
						to: a,
						metadata: tokenMetadata
					}
				})

				if (config.DISABLE_ASYNC_MINTING) {
					try {
						await services.meem.bulkMint({
							tokens,
							mintedBy: senderWalletAddress,
							meemContractId: meemContractInstance.id
						})
					} catch (e) {
						log.crit(e)
					}
				} else {
					const lambda = new AWS.Lambda({
						accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
						secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
						region: 'us-east-1'
					})
					await lambda
						.invoke({
							InvocationType: 'Event',
							FunctionName: config.LAMBDA_BULK_MINT_FUNCTION_NAME,
							Payload: JSON.stringify({
								tokens,
								mintedBy: senderWalletAddress,
								meemContractId: meemContractInstance.id
							})
						})
						.promise()
				}

				log.debug(`Finished minting admin/member tokens.`)
			}

			try {
				// TODO: pass createRoles property to contract instead of meem-club
				if (data.metadata.meem_contract_type === 'meem-club') {
					await services.guild.createMeemContractGuild({
						meemContractId: meemContractInstance.id,
						adminAddresses: cleanAdmins.map((a: any) => a.user.toLowerCase())
					})
				} else if (data.meemContractRoleData) {
					const {
						name: roleName,
						meemContract: parentMeemContract,
						meemContractGuild,
						permissions,
						isAdminRole
					} = data.meemContractRoleData
					const sign = (signableMessage: string | Bytes) =>
						wallet.signMessage(signableMessage)
					const createGuildRoleResponse = await guildRole.create(
						wallet.address,
						sign,
						{
							guildId: meemContractGuild.guildId,
							name: roleName,
							logic: 'AND',
							requirements: [
								{
									type: 'ERC721',
									chain: services.guild.getGuildChain(
										meemContractInstance.chainId
									),
									address: meemContract.address,
									data: {
										minAmount: 1
									}
								}
							]
						}
					)

					const meemContractRole = await orm.models.MeemContractRole.create({
						guildRoleId: createGuildRoleResponse.id,
						name: roleName,
						MeemContractId: parentMeemContract.id,
						MeemContractGuildId: meemContractGuild.id,
						RoleMeemContractId: meemContractInstance.id,
						tokenAddress: meemContract.address,
						isAdminRole: isAdminRole ?? false
					})

					if (!_.isUndefined(permissions) && _.isArray(permissions)) {
						const promises: Promise<any>[] = []
						const t = await orm.sequelize.transaction()
						const roleIdsToAdd =
							permissions.filter(pid => {
								const existingPermission =
									meemContractRole.RolePermissions?.find(rp => rp.id === pid)
								return !existingPermission
							}) ?? []

						if (roleIdsToAdd.length > 0) {
							const meemContractRolePermissionsData: {
								MeemContractRoleId: string
								RolePermissionId: string
							}[] = roleIdsToAdd.map(rid => {
								return {
									MeemContractRoleId: meemContractRole.id,
									RolePermissionId: rid
								}
							})
							promises.push(
								orm.models.MeemContractRolePermission.bulkCreate(
									meemContractRolePermissionsData,
									{
										transaction: t
									}
								)
							)
						}

						try {
							await Promise.all(promises)
							await t.commit()
							if (isAdminRole) {
								const parentContract = Mycontract__factory.connect(
									parentMeemContract.address,
									wallet
								)
								await parentContract.setAdminContract(meemContract.address)
							}
						} catch (e) {
							log.crit(e)
							throw new Error('SERVER_ERROR')
						}
					}
				}
			} catch (e) {
				log.crit('Failed to create Guild', e)
			}

			return meemContractInstance
		} catch (e) {
			await sockets?.emitError(
				config.errors.CONTRACT_CREATION_FAILED,
				senderWalletAddress
			)
			log.crit(e)
			throw new Error('CONTRACT_CREATION_FAILED')
		}
	}

	public static async prepareInitValues(
		data: Omit<
			MeemAPI.v1.ReInitializeMeemContract.IRequestBody,
			'merkleRoot' | 'mintPermissions'
		> & {
			mintPermissions?: Omit<MeemAPI.IMeemPermission, 'merkleRoot'>[]
			chainId: number
			senderWalletAddress: string
			meemContract?: MeemContract
		}
	) {
		// TODO: Abstract this to allow new types of contract metadata e.g. clubs, other project types
		// TODO: Generate the slug for the contract here and store the external URL
		// TOOD: How do we create associations between Clubs and their projects i.e MAGS?
		// TODO: Does each new (official) contract type have a model in our database?
		// TODO: Verify club exists before storing address in metadata?

		// TODO: Pass type-safe data in for contract types
		// TODO: 🚨 Validate all properties!

		const {
			mintPermissions,
			splits,
			isTransferLocked,
			tokenMetadata,
			senderWalletAddress,
			chainId,
			meemContract
		} = data

		let senderWallet = await orm.models.Wallet.findByAddress<Wallet>(
			senderWalletAddress
		)
		if (!senderWallet) {
			senderWallet = await orm.models.Wallet.create({
				address: senderWalletAddress
			})
			await services.meemId.createOrUpdateMeemIdentity({
				wallet: senderWallet
			})
		}

		let { metadata, symbol, name, maxSupply } = data

		if (!symbol && !meemContract && name) {
			symbol = slug(name, { lower: true })
		} else if (meemContract) {
			symbol = meemContract.symbol
		}

		if (!name && meemContract) {
			name = meemContract.name
		}

		if (!maxSupply && meemContract) {
			maxSupply = meemContract.maxSupply
		}

		if (!symbol || !name || !maxSupply) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!metadata && meemContract) {
			metadata = meemContract.metadata
		}

		const admins = data.admins ?? []
		const minters = data.minters ?? []

		if (!metadata?.meem_metadata_version) {
			throw new Error('INVALID_METADATA')
		}

		const contractMetadataValidator = new Validator(
			metadata.meem_metadata_version
		)
		const contractMetadataValidatorResult =
			contractMetadataValidator.validate(metadata)

		if (!contractMetadataValidatorResult.valid) {
			log.crit(
				contractMetadataValidatorResult.errors.map((e: any) => e.message)
			)
			throw new Error('INVALID_METADATA')
		}

		if (data.shouldMintTokens && !tokenMetadata?.meem_metadata_version) {
			throw new Error('INVALID_METADATA')
		}

		if (data.shouldMintTokens && tokenMetadata) {
			const tokenMetadataValidator = new Validator(
				tokenMetadata.meem_metadata_version
			)
			const tokenMetadataValidatorResult =
				tokenMetadataValidator.validate(tokenMetadata)

			if (!tokenMetadataValidatorResult.valid) {
				log.crit(tokenMetadataValidatorResult.errors.map((e: any) => e.message))
				throw new Error('INVALID_METADATA')
			}
		}

		const result = await services.web3.saveToPinata({ json: metadata })
		const { provider, wallet } = await services.ethers.getProvider({
			chainId
		})

		const uri = `ipfs://${result.IpfsHash}`

		const meemContractAdmins: MeemContractWallet[] = []
		const meemContractMinters: MeemContractWallet[] = []
		let meemContractWallets: MeemContractWallet[] = []

		if (meemContract) {
			meemContractWallets = await orm.models.MeemContractWallet.findAll({
				where: {
					MeemContractId: meemContract.id
				},
				include: [orm.models.Wallet]
			})

			meemContractWallets.forEach(w => {
				if (w.role === config.ADMIN_ROLE) {
					meemContractAdmins.push(w)
				} else if (w.role === config.MINTER_ROLE) {
					meemContractMinters.push(w)
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

		const meemContractWalletIdsToRemove: string[] = []
		const roles: SetRoleItemStruct[] = []

		// Find roles to remove
		meemContractWallets.forEach(meemContractWallet => {
			let foundItem: SetRoleItemStruct | undefined

			if (meemContractWallet.role === config.ADMIN_ROLE) {
				foundItem = cleanAdmins.find(
					c =>
						c.user.toLowerCase() ===
						meemContractWallet.Wallet?.address.toLowerCase()
				)
			} else if (meemContractWallet.role === config.MINTER_ROLE) {
				foundItem = cleanMinters.find(
					c =>
						c.user.toLowerCase() ===
						meemContractWallet.Wallet?.address.toLowerCase()
				)
			}

			if (!foundItem && meemContractWallet.Wallet) {
				roles.push({
					role: meemContractWallet.role,
					user: meemContractWallet.Wallet.address,
					hasRole: false
				})

				meemContractWalletIdsToRemove.push(meemContractWallet.id)
			}
		})

		// Find roles to add
		cleanAdmins.forEach(adminItem => {
			const existingAdmin = meemContractAdmins.find(
				a => a.Wallet?.address.toLowerCase() === adminItem.user.toLowerCase()
			)
			if (!existingAdmin) {
				roles.push(adminItem)
			}
		})

		cleanMinters.forEach(minterItem => {
			const existingAdmin = meemContractMinters.find(
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

	// Adapted from https://forum.openzeppelin.com/t/creating-gnosis-safes-via-the-api/12031/2
	// Gnosis safe deployments / abi: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/gnosis_safe.json
	// Gnosis proxy factory deployments / abi: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/proxy_factory.json
	public static async createClubSafe(
		options: MeemAPI.v1.CreateClubSafe.IRequestBody & {
			meemContractId: string
			senderWalletAddress: string
		}
	) {
		const { meemContractId, safeOwners, senderWalletAddress, chainId } = options
		try {
			const [meemContract, senderWallet] = await Promise.all([
				orm.models.MeemContract.findOne({
					where: {
						id: meemContractId
					}
				}),
				orm.models.Wallet.findByAddress<Wallet>(senderWalletAddress)
			])

			if (!senderWallet) {
				throw new Error('WALLET_NOT_FOUND')
			}

			if (!meemContract) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}

			if (meemContract.gnosisSafeAddress) {
				throw new Error('CLUB_SAFE_ALREADY_EXISTS')
			}

			const isAdmin = await this.isMeemContractAdmin({
				meemContractId: meemContract.id,
				walletAddress: senderWalletAddress
			})

			if (!isAdmin) {
				throw new Error('NOT_AUTHORIZED')
			}

			// This is one of the topics emitted when a gnosis safe is created
			const topic =
				'0x141df868a6331af528e38c83b7aa03edc19be66e37ae67f9285bf4f8e3c6a1a8'

			const threshold = options.threshold ?? 1

			// gnosisSafeAbi is the Gnosis Safe ABI in JSON format,
			const { provider, wallet } = await services.ethers.getProvider({
				chainId
			})
			const proxyContract = new ethers.Contract(
				config.GNOSIS_PROXY_CONTRACT_ADDRESS,
				GnosisSafeProxyABI,
				wallet
			)
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

			const tx = await services.ethers.runTransaction({
				chainId,
				fn: proxyContract.createProxy.bind(proxyContract),
				params: [config.GNOSIS_MASTER_CONTRACT_ADDRESS, safeSetupData],
				gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			await orm.models.Transaction.create({
				hash: tx.hash,
				chainId,
				WalletId: senderWallet.id
			})

			// await services.ethers.releaseLock(chainId)

			await tx.wait()

			const receipt = await provider.core.getTransactionReceipt(tx.hash)

			if (receipt) {
				// Find the newly created Safe contract address in the transaction receipt
				for (let i = 0; i < receipt.logs.length; i += 1) {
					const receiptLog = receipt.logs[i]
					const foundTopic = receiptLog.topics.find(t => t === topic)
					if (foundTopic) {
						log.info(`address: ${receiptLog.address}`)
						meemContract.gnosisSafeAddress = receiptLog.address
						break
					}
				}
			}

			await meemContract.save()
		} catch (e: any) {
			// await services.ethers.releaseLock(chainId)
			log.crit(e)
			await sockets?.emitError(
				config.errors.SAFE_CREATE_FAILED,
				senderWalletAddress
			)
			throw new Error('SAFE_CREATE_FAILED')
		}
	}

	public static async upgradeClub(
		options: MeemAPI.v1.UpgradeClub.IRequestBody & {
			meemContractId: string
			senderWalletAddress: string
		}
	) {
		const { meemContractId, senderWalletAddress } = options
		try {
			const [meemContract, senderWallet] = await Promise.all([
				orm.models.MeemContract.findOne({
					where: {
						id: meemContractId
					},
					include: [orm.models.Wallet]
				}),

				orm.models.Wallet.findByAddress<Wallet>(senderWalletAddress)
			])

			if (!meemContract) {
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
												chainId: meemContract.chainId
											}
										}
									]
								}
							]
						}
					]
				}),
				this.isMeemContractAdmin({
					meemContractId: meemContract.id,
					walletAddress: senderWalletAddress
				})
			])

			if (!isAdmin) {
				throw new Error('NOT_AUTHORIZED')
			}

			const fromVersion: IFacetVersion[] = []
			const toVersion: IFacetVersion[] = []

			const { wallet } = await services.ethers.getProvider({
				chainId: meemContract.chainId
			})

			const diamond = new ethers.Contract(
				meemContract.address,
				diamondABI,
				wallet
			)

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
			// 	proxyContractAddress: meemContract.address,
			// 	toVersion,
			// 	fromVersion,
			// 	overrides: {
			// 		gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
			// 	}
			// })
			const cuts = getCuts({
				proxyContractAddress: meemContract.address,
				toVersion,
				fromVersion
			})

			if (cuts.length === 0) {
				throw new Error('CONTRACT_ALREADY_UP_TO_DATE')
			}

			const diamondCut = new ethers.Contract(
				meemContract.address,
				IDiamondCut.abi,
				wallet
			)

			const tx = await services.ethers.runTransaction({
				chainId: meemContract.chainId,
				fn: diamondCut.diamondCut.bind(diamondCut),
				params: [cuts, ethers.constants.AddressZero, '0x'],
				gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			if (tx?.hash) {
				await orm.models.Transaction.create({
					hash: tx.hash,
					chainId: meemContract.chainId,
					WalletId: senderWallet.id
				})
			}

			await tx.wait()

			log.debug(`Upgrading club ${meemContract.address} w/ tx ${tx?.hash}`)
		} catch (e: any) {
			log.crit(e)
			await sockets?.emitError(
				config.errors.UPGRADE_CLUB_FAILED,
				senderWalletAddress
			)
			throw new Error('UPGRADE_CLUB_FAILED')
		}
	}

	public static async isMeemContractAdmin(options: {
		meemContractId: string
		walletAddress: string
	}) {
		const { meemContractId, walletAddress } = options
		const meemContractWallet = await orm.models.MeemContractWallet.findOne({
			where: {
				role: config.ADMIN_ROLE,
				MeemContractId: meemContractId
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

		if (meemContractWallet) {
			return true
		}

		return false
	}

	public static async getMeemContractRoles(options: {
		meemContractId: string
		meemContractRoleId?: string
	}): Promise<IMeemContractRole[]> {
		const { meemContractId, meemContractRoleId } = options
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractRole,
					...(meemContractRoleId && {
						where: {
							id: meemContractRoleId
						}
					}),
					include: [
						{
							model: orm.models.RolePermission,
							attributes: ['id'],
							through: {
								attributes: []
							}
						}
					]
				}
			]
		})

		const meemContractRoles = meemContract?.MeemContractRoles ?? []

		if (!meemContract) {
			throw new Error('SERVER_ERROR')
		}

		const roles: IMeemContractRole[] = await Promise.all(
			meemContractRoles.map(async mcRole => {
				const role: any = mcRole.toJSON()

				role.permissions = role.RolePermissions.map(
					(rp: RolePermission) => rp.id
				)

				delete role.RolePermissions

				if (mcRole.guildRoleId) {
					const guildRoleResponse = await guildRole.get(mcRole.guildRoleId)

					role.guildRole = guildRoleResponse

					if (meemContractRoleId) {
						role.memberMeemIds = await Promise.all(
							(role.guildRole?.members ?? []).map((m: string) =>
								services.meemId.getMeemIdentityForAddress(m)
							)
						)
					}
				}
				return role
			})
		)

		return roles
	}

	public static async getUserMeemContractRolesAccess(options: {
		meemContractId: string
		walletAddress: string
		meemContractRoleId?: string
	}): Promise<{
		hasRolesAccess: boolean
		roles: IMeemContractRole[]
	}> {
		const { meemContractId, walletAddress, meemContractRoleId } = options
		const meemIdentity = await orm.models.User.findOne({
			include: [
				{
					model: orm.models.Wallet,
					where: {
						address: walletAddress
					},
					attributes: ['id', 'address', 'ens'],
					through: {
						attributes: []
					}
				},
				{
					model: orm.models.Wallet,
					as: 'DefaultWallet',
					attributes: ['id', 'address', 'ens']
				}
			]
		})

		if (!meemIdentity) {
			log.crit('MeemIdentity not found')
			throw new Error('SERVER_ERROR')
		}

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild
				},
				{
					model: orm.models.MeemContractRole,
					...(meemContractRoleId && {
						where: {
							id: meemContractRoleId
						}
					}),
					include: [
						{
							model: orm.models.RolePermission,
							attributes: ['id'],
							through: {
								attributes: []
							}
						}
					]
				}
			]
		})

		const meemContractRoles = meemContract?.MeemContractRoles ?? []

		if (!meemContract || !meemContract.MeemContractGuild) {
			throw new Error('SERVER_ERROR')
		}

		const guildUserMembershipResponse = await guild.getUserMemberships(
			meemContract.MeemContractGuild.guildId,
			walletAddress
		)

		const rolesIdsWithAccess = guildUserMembershipResponse
			.filter(r => r.access)
			.map(r => r.roleId)

		if (rolesIdsWithAccess.length < 1) {
			return {
				hasRolesAccess: false,
				roles: []
			}
		}

		let roles: IMeemContractRole[] = await Promise.all(
			meemContractRoles.map(async mcRole => {
				const role: any = mcRole.toJSON()

				role.permissions = role.RolePermissions.map(
					(rp: RolePermission) => rp.id
				)

				delete role.RolePermissions

				if (mcRole.guildRoleId) {
					const guildRoleResponse = await guildRole.get(mcRole.guildRoleId)

					role.guildRole = guildRoleResponse

					if (meemContractRoleId) {
						role.memberMeemIds = await Promise.all(
							(role.guildRole?.members ?? []).map((m: string) =>
								services.meemId.getMeemIdentityForAddress(m)
							)
						)
					}
				}
				return role
			})
		)

		roles = roles.filter((r: IMeemContractRole) => {
			if (!r.guildRoleId && !r.guildRole) {
				return false
			}
			return r.guildRole.members.includes(walletAddress)
		})

		return {
			hasRolesAccess: true,
			roles
		}
	}

	public static async updateMeemContractAdmins(options: {
		meemContractId: string
		admins: string[]
		senderWallet: Wallet
	}): Promise<string[]> {
		const { meemContractId, admins, senderWallet } = options

		const isAdmin = await this.isMeemContractAdmin({
			meemContractId,
			walletAddress: senderWallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractRole
				}
			]
		})

		const meemContractAdminRole = (meemContract?.MeemContractRoles ?? []).find(
			r => r.isAdminRole
		)

		if (!meemContract || !meemContractAdminRole?.guildRoleId) {
			throw new Error('SERVER_ERROR')
		}

		const { wallet } = await services.ethers.getProvider({
			chainId: meemContract.chainId
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
			const meemSmartContract = (await services.meem.getMeemContract({
				address: meemContract.address,
				chainId: meemContract.chainId
			})) as unknown as Mycontract

			const tx = await services.ethers.runTransaction({
				chainId: meemContract.chainId,
				fn: meemSmartContract.bulkSetRoles.bind(meemSmartContract),
				params: [cleanAdmins],
				gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			await orm.models.Transaction.create({
				hash: tx.hash,
				chainId: meemContract.chainId,
				WalletId: senderWallet.id
			})

			await tx.wait()

			log.debug(`bulkSetRoles tx: ${tx.hash}`)
		}

		return cleanAdmins.map(a => a.user)
	}
}
