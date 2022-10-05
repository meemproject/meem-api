import { Response } from 'express'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class DiscordController {
	public static async authenticate(
		req: IRequest<MeemAPI.v1.AuthenticateWithDiscord.IDefinition>,
		res: IResponse<MeemAPI.v1.AuthenticateWithDiscord.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		try {
			const authData = await services.discord.authenticate({
				authCode: req.body.authCode,
				redirectUri: req.body.redirectUri
			})

			return res.json({
				...authData
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getGuilds(
		req: IRequest<MeemAPI.v1.GetDiscordServers.IDefinition>,
		res: IResponse<MeemAPI.v1.GetDiscordServers.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		try {
			const discordServersResponse = await services.discord.getDiscordGuilds({
				accessToken: req.query.accessToken
			})

			return res.json({
				discordServers: discordServersResponse
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	// public static async updateDiscordGuildRole(
	// 	req: IRequest<any>,
	// 	res: IResponse<any>
	// ): Promise<Response> {
	// 	if (!req.wallet) {
	// 		throw new Error('USER_NOT_LOGGED_IN')
	// 	}

	// 	const {
	// 		meemContractId,
	// 		meemContractRoleId,
	// 		discordGuildId,
	// 		gatedChannels
	// 	} = req.body

	// 	if (!discordGuildId || !gatedChannels) {
	// 		throw new Error('INVALID_PARAMETERS')
	// 	}

	// 	const meemContractRole = await orm.models.MeemContractRole.findOne({
	// 		where: {
	// 			id: meemContractRoleId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.RolePermission
	// 			},
	// 			{
	// 				model: orm.models.MeemContractGuild
	// 			}
	// 		]
	// 	})

	// 	if (!meemContractRole || !meemContractRole.guildRoleId) {
	// 		throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
	// 	}

	// 	try {
	// 		const updatedRole = await services.guild.updateMeemContractGuildRole({
	// 			meemContractId,
	// 			guildRoleId: meemContractRole.guildRoleId,
	// 			guildRoleData: {
	// 				rolePlatforms: [
	// 					{
	// 						guildPlatform: {
	// 							platformName: 'DISCORD',
	// 							platformGuildId: discordGuildId, // Discord server's ID
	// 							isNew: true
	// 						},
	// 						// Optionally specify the gated channels:
	// 						platformRoleData: {
	// 							gatedChannels
	// 						}
	// 					}
	// 				]
	// 			}
	// 		})

	// 		return res.json({
	// 			...updatedRole
	// 		})
	// 	} catch (e) {
	// 		log.crit(e)
	// 		throw new Error('SERVER_ERROR')
	// 	}
	// }
}
