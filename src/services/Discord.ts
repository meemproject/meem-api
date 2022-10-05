import request from 'superagent'

export default class DiscordService {
	public static async authenticate(data: {
		authCode: string
		redirectUri: string
	}): Promise<{
		user: any
		accessToken: string
	}> {
		const { authCode, redirectUri } = data
		try {
			const discordAuthResult = await request
				.post('https://discord.com/api/oauth2/token')
				.field('client_id', config.DISCORD_CLIENT_ID)
				.field('client_secret', config.DISCORD_CLIENT_SECRET)
				.field('grant_type', 'authorization_code')
				.field('redirect_uri', redirectUri)
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

			return {
				user: discordUserResult.body.user,
				accessToken: discordAuthResult.body.access_token
			}
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getDiscordGuilds(data: {
		accessToken: string
	}): Promise<any[]> {
		const { accessToken } = data
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
						guildData: guildDataResult.body
					}
				})
			)

			return guildsWithData ?? []
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}
}
