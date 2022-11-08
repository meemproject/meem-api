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
}
