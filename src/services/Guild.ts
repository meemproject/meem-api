/* eslint-disable no-await-in-loop */

import { Chain, guild, role, user } from '@guildxyz/sdk'
import { Bytes, ethers } from 'ethers'

export default class GuildService {
	public static async createGuild(data: {
		owner: string
		meemContractId: string
		name: string
		discordGuildId: string
	}): Promise<string> {
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: data.meemContractId
			}
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const provider = await services.ethers.getProvider()
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			const clubGuild = await guild.create(
				wallet.address, // You have to insert your own wallet here
				sign,
				{
					name: data.name,
					roles: [
						{
							name: 'Club Member',
							logic: 'OR',
							requirements: [
								{
									type: 'ERC20',
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
				}
			)

			const meemGuild = await orm.models.Guild.create({
				guildId: clubGuild.id
			})

			await orm.models.MeemContractGuild.create({
				GuildId: meemGuild.id,
				MeemContractId: meemContract.id
			})

			return meemGuild.id
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async updateGuildRole(data: {
		meemContractId: string
		guildId: string
		roleId: number
		discordGuildId?: string
		gatedChannels?: string[]
	}): Promise<any | null> {
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: data.meemContractId
			}
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const provider = await services.ethers.getProvider()
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			if (data.discordGuildId) {
				const response = await role.update(data.roleId, wallet.address, sign, {
					rolePlatforms: [
						{
							guildPlatform: {
								platformName: 'DISCORD',
								platformGuildId: data.discordGuildId, // Discord server's ID
								isNew: !data.gatedChannels
							},
							// Optionally specify the gated channels:
							...(data.gatedChannels && {
								platformRoleData: {
									gatedChannels: data.gatedChannels ?? []
								}
							})
						}
					]
				})
				return response
			}
			return null
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getUserGuilds(data: {
		walletAddress: string
	}): Promise<any[]> {
		const guildMemberships =
			(await user.getMemberships(data.walletAddress)) ?? []

		const guilds = await Promise.all(
			guildMemberships?.map(async gm =>
				orm.models.Guild.findOne({
					where: {
						guildId: gm.guildId
					}
				})
			)
		)

		return guilds ?? []
	}

	public static async getMeemContractGuilds(data: {
		meemContractId: string
	}): Promise<any[]> {
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: data.meemContractId
			}
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const guilds = await orm.models.Guild.findAll({
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						id: data.meemContractId
					}
				}
			]
		})

		const guildsData = await Promise.all(guilds.map(g => guild.get(g.guildId)))

		return guildsData
	}

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
