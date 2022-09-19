/* eslint-disable no-await-in-loop */

import {
	Chain,
	CreateGuildResponse,
	GetGuildsResponse,
	guild,
	role as guildRole,
	user
} from '@guildxyz/sdk'
import { Bytes, ethers } from 'ethers'
import MeemContract from '../models/MeemContract'
import MeemContractGuild from '../models/MeemContractGuild'
import MeemContractRole from '../models/MeemContractRole'

export default class GuildService {
	public static async createMeemContractGuild(data: {
		meemContract: MeemContract
	}): Promise<{
		meemContractGuild: MeemContractGuild
		meemContractRoles: MeemContractRole[]
	}> {
		const { meemContract } = data
		const provider = await services.ethers.getProvider()
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			const createGuildResponse = await guild.create(wallet.address, sign, {
				name: meemContract.name,
				roles: [
					{
						name: `${meemContract.name} Token Holder`,
						logic: 'OR',
						requirements: [
							{
								type: 'ERC721',
								chain:
									config.NETWORK === 'rinkeby'
										? ('RINKEBY' as Chain)
										: 'POLYGON',
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
				guildResponse.roles.map(async guildRole => {
					const meemContractRole = await orm.models.MeemContractRole.create({
						guildRoleId: guildRole.id,
						name: guildRole.name,
						MeemContractId: meemContract.id,
						MeemContractGuildId: meemContractGuild.id
					})
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
		const provider = await services.ethers.getProvider()
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
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

	// public static async updateGuildRole(data: {
	// 	meemContractId: string
	// 	guildId: string
	// 	roleId: number
	// 	discordGuildId?: string
	// 	gatedChannels?: string[]
	// }): Promise<any | null> {
	// 	const meemContract = await orm.models.MeemContract.findOne({
	// 		where: {
	// 			id: data.meemContractId
	// 		}
	// 	})

	// 	if (!meemContract) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	const provider = await services.ethers.getProvider()
	// 	const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

	// 	const sign = (signableMessage: string | Bytes) =>
	// 		wallet.signMessage(signableMessage)

	// 	try {
	// 		if (data.discordGuildId) {
	// 			const response = await role.update(data.roleId, wallet.address, sign, {
	// 				rolePlatforms: [
	// 					{
	// 						guildPlatform: {
	// 							platformName: 'DISCORD',
	// 							platformGuildId: data.discordGuildId, // Discord server's ID
	// 							isNew: !data.gatedChannels
	// 						},
	// 						// Optionally specify the gated channels:
	// 						...(data.gatedChannels && {
	// 							platformRoleData: {
	// 								gatedChannels: data.gatedChannels ?? []
	// 							}
	// 						})
	// 					}
	// 				]
	// 			})
	// 			return response
	// 		}
	// 		return null
	// 	} catch (e) {
	// 		log.crit(e)
	// 		throw new Error('SERVER_ERROR')
	// 	}
	// }

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
