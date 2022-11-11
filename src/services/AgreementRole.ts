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
			permissions: rolePermissions,
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
			},
			include: [
				{
					model: orm.models.RolePermission
				},
				{
					model: orm.models.AgreementGuild
				}
			]
		})

		if (!agreementRole) {
			throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
		}

		if (!_.isUndefined(rolePermissions) && _.isArray(rolePermissions)) {
			const promises: Promise<any>[] = []
			const t = await orm.sequelize.transaction()
			const permissions = rolePermissions
			const roleIdsToAdd =
				permissions.filter(pid => {
					const existingPermission = agreementRole.RolePermissions?.find(
						rp => rp.id === pid
					)
					return !existingPermission
				}) ?? []
			const rolesToRemove: string[] =
				agreementRole.RolePermissions?.filter(rp => {
					const existingPermission = permissions.find(pid => rp.id === pid)
					return !existingPermission
				})?.map((rp: any) => {
					return rp.AgreementRolePermission.id as string
				}) ?? []

			if (rolesToRemove.length > 0) {
				promises.push(
					orm.models.AgreementRolePermission.destroy({
						where: {
							id: rolesToRemove
						},
						transaction: t
					})
				)
			}

			if (roleIdsToAdd.length > 0) {
				const agreementRolePermissionsData: {
					AgreementRoleId: string
					RolePermissionId: string
				}[] = roleIdsToAdd.map(rid => {
					return {
						AgreementRoleId: agreementRole.id,
						RolePermissionId: rid
					}
				})
				promises.push(
					orm.models.AgreementRolePermission.bulkCreate(
						agreementRolePermissionsData,
						{
							transaction: t
						}
					)
				)
			}

			try {
				await Promise.all(promises)
				await t.commit()
			} catch (e) {
				log.crit(e)
				throw new Error('SERVER_ERROR')
			}
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
