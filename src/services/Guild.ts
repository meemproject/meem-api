/* eslint-disable no-await-in-loop */

import {
	Chain,
	CreateGuildResponse,
	GetGuildsResponse,
	guild,
	role,
	user
} from '@guildxyz/sdk'
import { Bytes, ethers } from 'ethers'
import MeemContract from '../models/MeemContract'
import MeemContractGuild from '../models/MeemContractGuild'

export default class GuildService {
	public static async createMeemContractGuild(data: {
		meemContract: MeemContract
	}): Promise<{
		meemContractGuild: MeemContractGuild
		response: CreateGuildResponse
	}> {
		const { meemContract } = data
		const provider = await services.ethers.getProvider()
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			const response = await guild.create(wallet.address, sign, {
				name: meemContract.name,
				roles: [
					{
						name: 'Club Member',
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
				guildId: response.id,
				MeemContractId: meemContract.id
			})

			return {
				meemContractGuild,
				response
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
