import _ from 'lodash'
import AgreementRole from '../models/AgreementRole'
import Wallet from '../models/Wallet'

export default class AgreementRoleService {
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
