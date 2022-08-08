// eslint-disable-next-line import/no-extraneous-dependencies
import { Response } from 'express'
import _ from 'lodash'
import request from 'superagent'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class IdentityController {
	public static async authenticateWithDiscord(
		req: IRequest<MeemAPI.v1.AuthenticateWithDiscord.IDefinition>,
		res: IResponse<MeemAPI.v1.AuthenticateWithDiscord.IResponseBody>
	): Promise<Response> {
		const { authCode } = req.body
		try {
			const discordAuthResult = await request
				.post('https://discord.com/api/oauth2/token')
				.field('client_id', config.DISCORD_CLIENT_ID)
				.field('client_secret', config.DISCORD_CLIENT_SECRET)
				.field('grant_type', 'authorization_code')
				.field('redirect_uri', config.DISCORD_AUTH_CALLBACK_URL)
				.field('code', authCode)

			if (!discordAuthResult.body.access_token) {
				throw new Error('NOT_AUTHORIZED')
			}

			const discordUserResult = await request
				.get('https://discord.com/api/oauth2/@me')
				.auth(discordAuthResult.body.access_token, {
					type: 'bearer'
				})

			if (!discordUserResult.body.user?.id) {
				throw new Error('NOT_AUTHORIZED')
			}

			// TODO: Store Discord User to Identity

			return res.json({
				accessToken: discordAuthResult.body.access_token
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getDiscordGuilds(
		req: IRequest<MeemAPI.v1.GetDiscordUserGuilds.IDefinition>,
		res: IResponse<MeemAPI.v1.GetDiscordUserGuilds.IResponseBody>
	): Promise<Response> {
		const { accessToken } = req.query
		try {
			if (!accessToken) {
				throw new Error('NOT_AUTHORIZED')
			}

			const discordGuildsResult = await request
				.get('https://discord.com/api/v10/users/@me/guilds')
				.auth(accessToken, {
					type: 'bearer'
				})
				.send()

			// TODO: Store Discord User to Identity
			let guilds = discordGuildsResult.body ?? []

			guilds = guilds.filter((g: any) => g.owner)

			const guildsWithData = await Promise.all(
				guilds.map(async (g: any) => {
					const guildDataResult = await request
						.post(`https://api.guild.xyz/v1/discord/server/${g.id}`)
						.send({
							payload: {
								authorization: accessToken
							}
						})
					return {
						...g,
						serverData: guildDataResult.body
					}
				})
			)

			return res.json({
				guilds: guildsWithData ?? []
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}
}
