import _ from 'lodash'
import MeemContractRole from '../models/MeemContractRole'
import Wallet from '../models/Wallet'

export default class MeemContractRoleService {
	public static async updateRole(data: {
		senderWallet: Wallet
		meemContractId: string
		meemContractRoleId: string
		name?: string
		permissions?: string[]
		members?: string[]
		guildRoleData?: any
	}): Promise<MeemContractRole> {
		const {
			senderWallet,
			meemContractId,
			meemContractRoleId,
			name,
			permissions: rolePermissions,
			members: roleMembers,
			guildRoleData
		} = data
		const isAdmin = await services.meemContract.isMeemContractAdmin({
			meemContractId,
			walletAddress: senderWallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			}
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const meemContractRole = await orm.models.MeemContractRole.findOne({
			where: {
				id: meemContractRoleId
			},
			include: [
				{
					model: orm.models.RolePermission
				},
				{
					model: orm.models.MeemContractGuild
				}
			]
		})

		if (!meemContractRole) {
			throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
		}

		if (!_.isUndefined(rolePermissions) && _.isArray(rolePermissions)) {
			const promises: Promise<any>[] = []
			const t = await orm.sequelize.transaction()
			const permissions = rolePermissions
			const roleIdsToAdd =
				permissions.filter(pid => {
					const existingPermission = meemContractRole.RolePermissions?.find(
						rp => rp.id === pid
					)
					return !existingPermission
				}) ?? []
			const rolesToRemove: string[] =
				meemContractRole.RolePermissions?.filter(rp => {
					const existingPermission = permissions.find(pid => rp.id === pid)
					return !existingPermission
				})?.map((rp: any) => {
					return rp.MeemContractRolePermission.id as string
				}) ?? []

			if (rolesToRemove.length > 0) {
				promises.push(
					orm.models.MeemContractRolePermission.destroy({
						where: {
							id: rolesToRemove
						},
						transaction: t
					})
				)
			}

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
			} catch (e) {
				log.crit(e)
				throw new Error('SERVER_ERROR')
			}
		}

		const updatedName = name
		let updatedMembers = roleMembers?.map(m => m.toLowerCase())

		if (
			meemContractRole.isAdminRole &&
			!_.isUndefined(updatedMembers) &&
			_.isArray(updatedMembers) &&
			meemContractRole.guildRoleId
		) {
			try {
				if (meemContractRole.isAdminRole && updatedMembers) {
					const admins = await services.meemContract.updateMeemContractAdmins({
						meemContractId: meemContract.id,
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

		if (meemContractRole.guildRoleId) {
			await services.guild.updateMeemContractGuildRole({
				guildRoleId: meemContractRole.guildRoleId,
				meemContractId: meemContract.id,
				name: updatedName,
				members: updatedMembers,
				guildRoleData,
				senderWalletAddress: senderWallet.address
			})
		}

		return meemContractRole
	}
}
