/* eslint-disable no-await-in-loop */

import { Chain, guild, role as guildRole } from '@guildxyz/sdk'
// eslint-disable-next-line import/named
import { Bytes, ethers } from 'ethers'
import MeemContract from '../models/MeemContract'
import MeemContractGuild from '../models/MeemContractGuild'
import MeemContractRole from '../models/MeemContractRole'

export default class GuildService {
	public static getGuildChain(chainId: number): Chain {
		switch (chainId) {
			case 1:
				return 'ETHEREUM'
				break
			case 4:
				return 'RINKEBY' as Chain
				break
			case 5:
				return 'GOERLI'
				break
			case 137:
				return 'POLYGON'
				break
			case 420:
				return 'OPTIMISM'
				break
			case 421613:
				return 'ARBITRUM'
				break
			default:
				return 'POLYGON'
		}
	}

	public static async createMeemContractGuild(data: {
		meemContractId: string
	}): Promise<{
		meemContractGuild: MeemContractGuild
		meemContractRoles: MeemContractRole[]
	}> {
		const { meemContractId } = data
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild,
					include: [
						{
							model: orm.models.MeemContractRole
						}
					]
				}
			]
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (meemContract.MeemContractGuild) {
			return {
				meemContractGuild: meemContract.MeemContractGuild,
				meemContractRoles:
					meemContract.MeemContractGuild?.MeemContractRoles ?? []
			}
		}

		const provider = await services.ethers.getProvider({
			chainId: meemContract.chainId
		})
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		const adminWallets = await orm.models.MeemContractWallet.findAll({
			where: {
				MeemContractId: meemContract.id,
				role: config.ADMIN_ROLE
			},
			include: [orm.models.Wallet]
		})

		const adminAddresses = adminWallets
			.map(aw => aw.Wallet?.address ?? '')
			.filter(a => a !== '' && a !== wallet.address.toLowerCase())

		try {
			const createGuildResponse = await guild.create(wallet.address, sign, {
				name: meemContract.name,
				roles: [
					{
						name: `${meemContract.name} Admin`,
						logic: 'OR',
						requirements: [
							{
								type: 'ALLOWLIST',
								data: {
									addresses: adminAddresses
								}
							}
						]
					},
					{
						name: `${meemContract.name} Member`,
						logic: 'OR',
						requirements: [
							{
								type: 'ERC721',
								chain: this.getGuildChain(meemContract.chainId),
								address: meemContract.address,
								data: {
									minAmount: 1
								}
							}
						]
					}
				]
			})

			const meemContractGuild = await orm.models.MeemContractGuild.create({
				guildId: createGuildResponse.id,
				MeemContractId: meemContract.id
			})

			const guildResponse = await guild.get(createGuildResponse.id)

			const meemContractRoles = await Promise.all(
				guildResponse.roles.map(async role => {
					const meemContractRole = await orm.models.MeemContractRole.create({
						guildRoleId: role.id,
						name: role.name,
						MeemContractId: meemContract.id,
						MeemContractGuildId: meemContractGuild.id
					})

					if (role.name.toLowerCase().includes('admin')) {
						const meemContractRolePermissionsData: {
							MeemContractRoleId: string
							RolePermissionId: string
						}[] = [
							'clubs.admin.editProfile',
							'clubs.admin.manageMembershipSettings',
							'clubs.admin.manageRoles'
						].map(rid => {
							return {
								MeemContractRoleId: meemContractRole.id,
								RolePermissionId: rid
							}
						})

						await orm.models.MeemContractRolePermission.bulkCreate(
							meemContractRolePermissionsData
						)
					}

					return meemContractRole
				})
			)

			return {
				meemContractGuild,
				meemContractRoles
			}
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async deleteMeemContractGuild(data: {
		meemContractId: string
	}): Promise<void> {
		const { meemContractId } = data
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild,
					include: [
						{
							model: orm.models.MeemContractRole,
							include: [
								{
									model: orm.models.RolePermission
								}
							]
						}
					]
				}
			]
		})

		if (!meemContract || !meemContract.MeemContractGuild) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const provider = await services.ethers.getProvider({
			chainId: meemContract.chainId
		})
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			await guild.delete(
				meemContract.MeemContractGuild.guildId,
				wallet.address,
				sign,
				true
			)

			const promises: Promise<any>[] = []
			const t = await orm.sequelize.transaction()

			promises.push(
				orm.models.MeemContractRole.destroy({
					where: {
						id: meemContract.MeemContractGuild.MeemContractRoles?.map(
							role => role.id
						)
					},
					transaction: t
				})
			)

			promises.push(
				orm.models.MeemContractGuild.destroy({
					where: {
						id: meemContract.MeemContractGuild.id
					},
					transaction: t
				})
			)

			await Promise.all(promises)
			await t.commit()

			return
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getMeemContractGuild(data: {
		meemContractId: string
	}): Promise<MeemContractGuild | null> {
		try {
			const meemContractGuild = await orm.models.MeemContractGuild.findOne({
				where: {
					MeemContractId: data.meemContractId
				}
			})
			return meemContractGuild
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async createMeemContractGuildRole(data: {
		name: string
		meemContract: MeemContract
		meemContractGuild: MeemContractGuild
		members: string[]
	}): Promise<MeemContractRole> {
		const { name, meemContract, meemContractGuild, members } = data
		const provider = await services.ethers.getProvider({
			chainId: meemContract.chainId
		})
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			// TODO: Meem Contract Tokens
			const createGuildRoleResponse = await guildRole.create(
				wallet.address,
				sign,
				{
					guildId: meemContractGuild.guildId,
					name,
					logic: 'OR',
					requirements: [
						{
							type: 'ALLOWLIST',
							data: {
								addresses: members
							}
						}
					]
				}
			)

			const meemContractRole = await orm.models.MeemContractRole.create({
				guildRoleId: createGuildRoleResponse.id,
				name,
				MeemContractId: meemContract.id,
				MeemContractGuildId: meemContractGuild.id
			})

			return meemContractRole
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async updateMeemContractGuildRole(data: {
		name?: string
		meemContractId: string
		guildRoleId: number
		members: string[]
	}): Promise<MeemContractRole> {
		const { name, meemContractId, guildRoleId, members } = data

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild,
					include: [
						{
							model: orm.models.MeemContractRole
						}
					]
				}
			]
		})

		const meemContractRole = meemContract?.MeemContractRoles?.find(
			r => r.guildRoleId === guildRoleId
		)

		if (!meemContract || !meemContractRole) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const provider = await services.ethers.getProvider({
			chainId: meemContract.chainId
		})

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			// TODO: Meem Contract Tokens
			const existingGuildRole = await guildRole.get(guildRoleId)
			await guildRole.update(guildRoleId, wallet.address, sign, {
				name: name ?? existingGuildRole.name,
				logic: 'OR',
				requirements: [
					{
						type: 'ALLOWLIST',
						data: {
							addresses: members
						}
					}
				]
			})

			return meemContractRole
		} catch (e) {
			// TODO: Re-create guild role if no longer exists?
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	// public static async getUserGuilds(data: {
	// 	walletAddress: string
	// }): Promise<any[]> {
	// 	const guildMemberships =
	// 		(await user.getMemberships(data.walletAddress)) ?? []

	// 	const guilds = await Promise.all(
	// 		guildMemberships?.map(async gm =>
	// 			orm.models.Guild.findOne({
	// 				where: {
	// 					guildId: gm.guildId
	// 				}
	// 			})
	// 		)
	// 	)

	// 	return guilds ?? []
	// }

	// public static async getMeemContractGuilds(data: {
	// 	meemContractId: string
	// }): Promise<any[]> {
	// 	const meemContract = await orm.models.MeemContract.findOne({
	// 		where: {
	// 			id: data.meemContractId
	// 		}
	// 	})

	// 	if (!meemContract) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	const guilds = await orm.models.Guild.findAll({
	// 		include: [
	// 			{
	// 				model: orm.models.MeemContract,
	// 				where: {
	// 					id: data.meemContractId
	// 				}
	// 			}
	// 		]
	// 	})

	// 	const guildsData = await Promise.all(guilds.map(g => guild.get(g.guildId)))

	// 	return guildsData
	// }

	// public static async getMeemContractGuilds(data: {
	// 	meemContractId: string
	// }): Promise<any[]> {
	// 	const meemContract = await orm.models.MeemContract.findOne({
	// 		where: {
	// 			id: data.meemContractId
	// 		}
	// 	})

	// 	if (!meemContract) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	const guilds = await orm.models.Guild.findAll({
	// 		include: [
	// 			{
	// 				model: orm.models.MeemContract,
	// 				where: {
	// 					id: data.meemContractId
	// 				}
	// 			}
	// 		]
	// 	})

	// 	const guildsData = await Promise.all(guilds.map(g => guild.get(g.guildId)))

	// 	return guildsData
	// }
}
