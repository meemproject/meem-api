import _ from 'lodash'
import slug from 'slug'
import AgreementRole from '../models/AgreementRole'
import Wallet from '../models/Wallet'

export default class AgreementRoleService {
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
		const existingSlug = await orm.models.AgreementRole.findOne({
			where: {
				slug: slugToCheck,
				chainId
			}
		})
		return !existingSlug
	}

	public static async updateRole(data: {
		senderWallet: Wallet
		agreementId: string
		agreementRoleId: string
		name?: string
		permissions?: string[]
		members?: string[]
		guildRoleData?: any
	}): Promise<AgreementRole> {
		const {
			senderWallet,
			agreementId,
			agreementRoleId,
			members: roleMembers
		} = data
		const isAdmin = await services.agreement.isAgreementAdmin({
			agreementId,
			walletAddress: senderWallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const agreementRole = await orm.models.AgreementRole.findOne({
			where: {
				id: agreementRoleId
			}
		})

		if (!agreementRole) {
			throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
		}

		// const updatedName = name
		let updatedMembers = roleMembers?.map(m => m.toLowerCase())

		if (
			agreementRole.isAdminRole &&
			!_.isUndefined(updatedMembers) &&
			_.isArray(updatedMembers)
		) {
			try {
				if (agreementRole.isAdminRole && updatedMembers) {
					const admins = await services.agreement.updateAgreementAdmins({
						agreementId: agreement.id,
						admins: updatedMembers,
						senderWallet
					})
					updatedMembers = admins
				}
			} catch (e) {
				log.crit(e)
				throw new Error('SERVER_ERROR')
			}
		}

		// if (agreementRole.guildRoleId) {
		// 	await services.guild.updateAgreementGuildRole({
		// 		guildRoleId: agreementRole.guildRoleId,
		// 		agreementId: agreement.id,
		// 		name: updatedName,
		// 		members: updatedMembers,
		// 		guildRoleData,
		// 		senderWalletAddress: senderWallet.address
		// 	})
		// }

		return agreementRole
	}
}
