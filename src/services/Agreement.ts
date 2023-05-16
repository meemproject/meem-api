/* eslint-disable import/no-extraneous-dependencies */
import { getMerkleInfo } from '@meemproject/meem-contracts'
import { Validator } from '@meemproject/metadata'
// eslint-disable-next-line import/named
import { ethers } from 'ethers'
import _ from 'lodash'
import { Op } from 'sequelize'
import slug from 'slug'
import { v4 as uuidv4 } from 'uuid'
import type Agreement from '../models/Agreement'
import AgreementRole from '../models/AgreementRole'
import Wallet from '../models/Wallet'
import { InitParamsStruct, Mycontract, SetRoleItemStruct } from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
import { IAgreementRole } from '../types/shared/meem.shared'

export default class AgreementService {
	public static async generateSlug(options: {
		baseSlug: string
		chainId: number
		agreementId?: string
		depth?: number
	}): Promise<string> {
		const { baseSlug, chainId, agreementId, depth } = options
		const theSlug = slug(baseSlug, { lower: true })

		try {
			const isAvailable = await this.isSlugAvailable({
				slugToCheck: theSlug,
				chainId,
				agreementId
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
				agreementId,
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
		agreementId?: string
	}): Promise<boolean> {
		const { slugToCheck, chainId, agreementId } = options
		let existingSlug = null

		if (agreementId) {
			existingSlug = await orm.models.AgreementRole.findOne({
				where: {
					slug: slugToCheck,
					AgreementId: agreementId,
					chainId
				}
			})
		} else {
			existingSlug = await orm.models.Agreement.findOne({
				where: {
					slug: slugToCheck,
					chainId
				}
			})
		}
		return !existingSlug
	}

	public static async reinitializeAgreementOrRole(
		data: (
			| MeemAPI.v1.ReInitializeAgreement.IRequestBody
			| MeemAPI.v1.ReInitializeAgreementRole.IRequestBody
		) & {
			senderWalletAddress: string
			agreementId: string
			agreementRoleId?: string
		}
	) {
		const { senderWalletAddress, agreementId, agreementRoleId, metadata } = data
		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		const agreementRole = agreementRoleId
			? await orm.models.AgreementRole.findOne({
					where: {
						id: agreementRoleId
					}
			  })
			: null

		if (!agreement || (agreementRoleId && !agreementRole)) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const agreementOrRole = agreementRole ?? agreement

		const { contractInitParams, fullMintPermissions } =
			await this.prepareInitValues({
				...data,
				chainId: agreementOrRole.chainId,
				agreementOrRole
			})

		if (metadata && agreement.isOnChain) {
			const result = await services.web3.saveToPinata({
				json: {
					...metadata
				}
			})

			contractInitParams.contractURI = `ipfs://${result.IpfsHash}`
		}

		// Even if reinitializing role, check parent agreement for admin role.
		const isAdmin = await agreement.isAdmin(senderWalletAddress)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		agreementOrRole.mintPermissions = fullMintPermissions

		await agreementOrRole.save()

		return {}
	}

	public static async createAgreementWithoutContract(options: {
		body: MeemAPI.v1.CreateAgreement.IRequestBody
		owner: Wallet
	}) {
		const { body, owner } = options
		const {
			metadata,
			name,
			symbol,
			chainId,
			shouldCreateAdminRole,
			mintPermissions,
			splits
		} = body

		const agreementSlug = await this.generateSlug({
			baseSlug: name,
			chainId: chainId ?? 0
		})

		const agreementData = {
			slug: agreementSlug,
			symbol: symbol ?? agreementSlug,
			name,
			address: ethers.constants.AddressZero,
			metadata,
			maxSupply: 0,
			mintPermissions,
			splits,
			chainId,
			OwnerId: owner?.id,
			isOnChain: false,
			isLaunched: true
		}

		const agreement = await orm.models.Agreement.create(agreementData)

		let adminAgreement: AgreementRole | undefined

		if (shouldCreateAdminRole) {
			adminAgreement = await orm.models.AgreementRole.create({
				...agreementData,
				name: `${name} Admin Role`,
				AgreementId: agreement.id,
				isAdminRole: true
			})
		}

		return { agreement, adminAgreement }
	}

	public static async prepareInitValues(
		data: Omit<
			MeemAPI.v1.ReInitializeAgreement.IRequestBody,
			'merkleRoot' | 'mintPermissions'
		> & {
			mintPermissions?: Omit<MeemAPI.IMeemPermission, 'merkleRoot'>[]
			chainId: number
			senderWalletAddress: string
			agreementOrRole?: Agreement | AgreementRole
			contractURI?: string
		}
	) {
		const {
			mintPermissions,
			splits,
			isTransferLocked,
			senderWalletAddress,
			chainId,
			agreementOrRole
		} = data

		let { contractURI } = data

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

		if (!symbol && !agreementOrRole && name) {
			symbol = slug(name, { lower: true })
		} else if (agreementOrRole) {
			symbol = agreementOrRole.symbol
		}

		if (!name && agreementOrRole) {
			name = agreementOrRole.name
		}

		if (!maxSupply && agreementOrRole) {
			maxSupply = agreementOrRole.maxSupply
		}

		if (!symbol || !name || !maxSupply) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!metadata && agreementOrRole) {
			metadata = agreementOrRole.metadata
		}

		const admins = data.admins ?? []
		const minters = data.minters ?? []

		if (!metadata?.meem_metadata_version || !metadata?.meem_metadata_type) {
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

		const { provider, wallet } = await services.ethers.getProvider({
			chainId
		})

		const agreementOrRoleAdmins: { address: string; role: string }[] = []
		const agreementOrRoleMinters: { address: string; role: string }[] = []
		let agreementOrRoleWallets: { address: string; role: string }[] = []

		if (agreementOrRole) {
			const isRoleAgreement =
				metadata.meem_metadata_type === 'Meem_AgreementRoleContract'

			const agreemetOrRoleWalletsQuery = isRoleAgreement
				? await orm.models.AgreementRoleWallet.findAll({
						where: {
							AgreementRoleId: agreementOrRole.id
						},
						include: [orm.models.Wallet]
				  })
				: await orm.models.AgreementWallet.findAll({
						where: {
							AgreementId: agreementOrRole.id
						},
						include: [orm.models.Wallet]
				  })

			agreementOrRoleWallets = agreemetOrRoleWalletsQuery.map(aw => {
				return {
					address: aw.Wallet?.address ?? '',
					role: aw.role
				}
			})

			agreementOrRoleWallets.forEach(w => {
				if (w.role === config.ADMIN_ROLE) {
					agreementOrRoleAdmins.push(w)
				} else if (w.role === config.MINTER_ROLE) {
					agreementOrRoleMinters.push(w)
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

		const roles: SetRoleItemStruct[] = []

		// Find roles to remove
		agreementOrRoleWallets.forEach(agreementOrRoleWallet => {
			let foundItem: SetRoleItemStruct | undefined

			if (agreementOrRoleWallet.role === config.ADMIN_ROLE) {
				foundItem = cleanAdmins.find(
					c =>
						c.user.toLowerCase() === agreementOrRoleWallet.address.toLowerCase()
				)
			} else if (agreementOrRoleWallet.role === config.MINTER_ROLE) {
				foundItem = cleanMinters.find(
					c =>
						c.user.toLowerCase() === agreementOrRoleWallet.address.toLowerCase()
				)
			}

			if (!foundItem && agreementOrRoleWallet.address !== '') {
				roles.push({
					role: agreementOrRoleWallet.role,
					user: agreementOrRoleWallet.address,
					hasRole: false
				})
			}
		})

		// Find roles to add
		cleanAdmins.forEach(adminItem => {
			const existingAdmin = agreementOrRoleAdmins.find(
				a => a.address.toLowerCase() === adminItem.user.toLowerCase()
			)
			if (!existingAdmin) {
				roles.push(adminItem)
			}
		})

		cleanMinters.forEach(minterItem => {
			const existingMinter = agreementOrRoleMinters.find(
				a => a.address.toLowerCase() === minterItem.user.toLowerCase()
			)
			if (!existingMinter) {
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

		if (agreementOrRole && !contractURI) {
			contractURI = agreementOrRole.contractURI
		}

		const contractInitParams: InitParamsStruct = {
			symbol,
			name,
			// Metadata will be saved to ipfs and replace contractURI in queued transaction
			contractURI: contractURI ?? '',
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
		data: (
			| MeemAPI.v1.BulkMintAgreementTokens.IRequestBody
			| MeemAPI.v1.BulkMintAgreementRoleTokens.IRequestBody
		) & {
			agreementId: string
			agreementRoleId?: string
			mintedBy: string
		}
	) {
		const { agreementId, agreementRoleId, tokens, mintedBy } = data

		if (!agreementId) {
			throw new Error('MISSING_CONTRACT_ADDRESS')
		}

		const [agreement, minterWallet] = await Promise.all([
			orm.models.Agreement.findOne({
				where: {
					id: agreementId
				}
			}),
			orm.models.Wallet.findByAddress<Wallet>(mintedBy)
		])

		if (!minterWallet) {
			throw new Error('WALLET_NOT_FOUND')
		}

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		let agreementRole: AgreementRole | undefined | null

		if (agreementRoleId) {
			agreementRole = await orm.models.AgreementRole.findOne({
				where: {
					id: agreementRoleId
				}
			})
		}

		const builtData: {
			to: string
			metadata: MeemAPI.IMeemMetadataLike
			ipfs?: string
		}[] = []

		const toAddresses: string[] = []

		// Validate metadata
		tokens.forEach(token => {
			if (!token.to) {
				throw new Error('MISSING_ACCOUNT_ADDRESS')
			}

			if (!token.metadata) {
				throw new Error('INVALID_METADATA')
			}

			const validator = new Validator({
				meem_metadata_type: agreementRoleId
					? 'Meem_AgreementRoleToken'
					: 'Meem_AgreementToken',
				meem_metadata_version: token.metadata.meem_metadata_version
			})
			const validatorResult = validator.validate(token.metadata)

			if (!validatorResult.valid) {
				log.crit(validatorResult.errors.map((e: any) => e.message))
				throw new Error('INVALID_METADATA')
			}

			toAddresses.push(token.to)

			builtData.push({
				...token,
				metadata: token.metadata
			})
		})

		// Pin to IPFS
		if (agreement.isOnChain) {
			for (let i = 0; i < builtData.length; i++) {
				const item = builtData[i]
				const result = await services.web3.saveToPinata({
					json: { ...item.metadata }
				})
				item.ipfs = `ipfs://${result.IpfsHash}`
			}
		}

		const bulkParams: Parameters<Mycontract['bulkMint']>[0] = builtData.map(
			item => ({
				to: item.to,
				tokenType: MeemAPI.MeemType.Original,
				tokenURI: (item.ipfs as string) ?? ''
			})
		)

		log.debug('Bulk Minting w/ params', { bulkParams })

		let txId: string | undefined

		let [tokenId, wallets] = await Promise.all([
			agreementRole
				? orm.models.AgreementRoleToken.count({
						where: {
							AgreementId: agreementRole.id
						}
				  })
				: orm.models.AgreementToken.count({
						where: {
							AgreementId: agreement.id
						}
				  }),
			orm.models.Wallet.findAll({
				where: {
					address: {
						[Op.in]: toAddresses
					}
				}
			})
		])

		const missingWalletAddresses = toAddresses.filter(a => {
			const foundWallet = wallets.find(w => w.address === a)
			if (foundWallet) {
				return false
			}

			return true
		})

		if (missingWalletAddresses.length > 0) {
			await orm.models.Wallet.bulkCreate(
				missingWalletAddresses.map(a => ({ address: a }))
			)

			wallets = await orm.models.Wallet.findAll({
				where: {
					address: {
						[Op.in]: toAddresses
					}
				}
			})
		}

		const now = new Date()
		const insertData = builtData.map(item => {
			const itemId = tokenId + 1
			tokenId++
			const wallet = wallets.find(w => w.address === item.to)
			if (!wallet) {
				log.crit('Wallet not found', { item })
			}
			return {
				id: uuidv4(),
				tokenId: services.web3.toBigNumber(itemId),
				tokenURI: item.ipfs ?? '',
				mintedAt: now,
				metadata: item.metadata,
				mintedBy,
				AgreementId: agreement.id,
				AgreementRoleId: agreementRole?.id,
				OwnerId: wallet?.id
			}
		})
		if (agreementRole) {
			await orm.models.AgreementRoleToken.bulkCreate(insertData)
		} else {
			await orm.models.AgreementToken.bulkCreate(insertData)
		}

		return { txId }
	}

	/** Burn an Agreement Token */
	public static async bulkBurn(
		data: (
			| MeemAPI.v1.BulkBurnAgreementTokens.IRequestBody
			| MeemAPI.v1.BulkBurnAgreementRoleTokens.IRequestBody
		) & {
			agreementId: string
			agreementRoleId?: string
		}
	) {
		const { agreementId, agreementRoleId, tokenIds } = data

		if (!agreementId) {
			throw new Error('MISSING_CONTRACT_ADDRESS')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		let agreementRole

		if (agreementRoleId) {
			agreementRole = await orm.models.AgreementRole.findOne({
				where: {
					id: agreementRoleId
				}
			})
		}

		log.debug('Bulk burning tokens', { tokenIds })

		let txId: string | undefined

		if (agreementRole && !agreementRole.isOnChain) {
			await orm.models.AgreementRoleToken.destroy({
				where: {
					AgreementRoleId: agreementRole.id,
					tokenId: {
						[Op.in]: tokenIds
					}
				}
			})
		} else if (agreement && !agreement.isOnChain) {
			await orm.models.AgreementToken.destroy({
				where: {
					AgreementId: agreement.id,
					tokenId: {
						[Op.in]: tokenIds
					}
				}
			})
		}

		return { txId }
	}

	public static async updateAgreement(options: {
		agreementId: string
		senderWalletAddress: string
		updates: MeemAPI.v1.UpdateAgreement.IRequestBody
	}): Promise<Agreement> {
		const { agreementId, senderWalletAddress, updates } = options
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
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const isAdmin = await agreement.isAdmin(senderWalletAddress)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		if (!_.isUndefined(updates.isLaunched)) {
			agreement.isLaunched = updates.isLaunched
		}

		try {
			await agreement.save()
		} catch (e) {
			log.crit('Error saving agreement', e)
			throw new Error('UPDATE_AGREEMENT_FAILED')
		}

		return agreement
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
				return role
			})
		)

		return roles
	}

	public static async acceptInvite(options: { code: string; wallet: Wallet }) {
		const { code, wallet } = options
		if (!code) {
			throw new Error('MISSING_PARAMETERS')
		}

		const invite = await orm.models.Invite.findOne({
			where: {
				code
			},
			include: [orm.models.Agreement]
		})

		if (!invite || !invite.Agreement) {
			throw new Error('INVITE_NOT_FOUND')
		}

		const agreementId = invite.AgreementId
		const agreement = invite.Agreement

		const result = await Promise.all([
			orm.models.AgreementToken.findOne({
				where: {
					AgreementId: agreementId,
					OwnerId: wallet.id
				}
			}),
			orm.models.AgreementToken.count({
				where: {
					AgreementId: agreementId
				}
			})
		])

		let agreementToken = result[0]
		const tokenId = result[1]

		if (!agreementToken) {
			const createResult = await Promise.all([
				orm.models.AgreementToken.create({
					tokenId: services.web3.toBigNumber(tokenId + 1).toHexString(),
					AgreementId: agreementId,
					OwnerId: wallet.id
				}),
				invite.destroy()
			])

			agreementToken = createResult[0]
		}

		return { agreement, agreementToken }
	}
}
