import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Events } from '../services/Analytics'
import { IAuthenticatedRequest, IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class DiscordController {
	public static async inviteBot(
		req: IAuthenticatedRequest<MeemAPI.v1.InviteDiscordBot.IDefinition>,
		res: IResponse<MeemAPI.v1.InviteDiscordBot.IResponseBody>
	): Promise<Response> {
		const agreementId = req.query.agreementId as string

		if (!agreementId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const isAdmin = await agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		let agreementDiscord = await orm.models.AgreementDiscord.findOne({
			where: {
				AgreementId: agreementId,
				DiscordId: null
			}
		})

		const code = uuidv4()

		if (agreementDiscord) {
			agreementDiscord.code = code
		} else {
			agreementDiscord = orm.models.AgreementDiscord.build({
				AgreementId: agreementId,
				code
			})
		}

		await agreementDiscord.save()

		services.analytics.track([
			{
				name: Events.DiscordBotInvited,
				agreementId
			}
		])

		return res.json({
			inviteUrl: `https://discord.com/api/oauth2/authorize?client_id=${config.DISCORD_APP_ID}&permissions=309237696576&scope=bot%20applications.commands`,
			// Manage channels and manage permissions
			// inviteUrl: `https://discord.com/api/oauth2/authorize?client_id=${config.DISCORD_APP_ID}&permissions=311653616720&scope=bot%20applications.commands`,
			code
		})
	}

	public static async getChannels(
		req: IAuthenticatedRequest<MeemAPI.v1.GetDiscordChannels.IDefinition>,
		res: IResponse<MeemAPI.v1.GetDiscordChannels.IResponseBody>
	): Promise<any> {
		const agreementDiscordId = req.query.agreementDiscordId as string

		if (!agreementDiscordId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreementDiscord = await orm.models.AgreementDiscord.findOne({
			where: {
				id: agreementDiscordId
			},
			include: [orm.models.Discord, orm.models.Agreement]
		})

		if (
			!agreementDiscord ||
			!agreementDiscord?.Discord?.guildId ||
			!agreementDiscord?.Agreement
		) {
			throw new Error('DISCORD_NOT_FOUND')
		}

		const isAdmin = await agreementDiscord.Agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const channels = await services.discord.getChannels(
			agreementDiscord.Discord.guildId
		)

		return res.json({
			channels
		})
	}

	public static async getRoles(
		req: IAuthenticatedRequest<MeemAPI.v1.GetDiscordRoles.IDefinition>,
		res: IResponse<MeemAPI.v1.GetDiscordRoles.IResponseBody>
	): Promise<any> {
		const agreementDiscordId = req.query.agreementDiscordId as string

		if (!agreementDiscordId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreementDiscord = await orm.models.AgreementDiscord.findOne({
			where: {
				id: agreementDiscordId
			},
			include: [orm.models.Discord, orm.models.Agreement]
		})

		if (
			!agreementDiscord ||
			!agreementDiscord?.Discord?.guildId ||
			!agreementDiscord.Agreement
		) {
			throw new Error('DISCORD_NOT_FOUND')
		}

		const isAdmin = await agreementDiscord.Agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const guild = await services.discord.client.guilds.fetch(
			agreementDiscord.Discord.guildId
		)

		const roles = guild.roles.cache.map(r => ({
			id: r.id,
			name: r.name,
			managed: r.managed,
			color: r.color,
			icon: r.icon
		}))

		return res.json({
			roles
		})
	}

	public static async getEmojis(
		req: IAuthenticatedRequest<MeemAPI.v1.GetDiscordEmojis.IDefinition>,
		res: IResponse<MeemAPI.v1.GetDiscordEmojis.IResponseBody>
	): Promise<any> {
		const agreementDiscordId = req.query.agreementDiscordId as string

		if (!agreementDiscordId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreementDiscord = await orm.models.AgreementDiscord.findOne({
			where: {
				id: agreementDiscordId
			},
			include: [orm.models.Discord, orm.models.Agreement]
		})

		if (
			!agreementDiscord ||
			!agreementDiscord?.Discord?.guildId ||
			!agreementDiscord.Agreement
		) {
			throw new Error('DISCORD_NOT_FOUND')
		}

		const isAdmin = await agreementDiscord.Agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const { emojis } = services.discord.client

		const filteredEmojis = emojis.cache.map(e => ({
			id: e.id,
			name: e.name ?? e.id,
			url: e.url,
			isAnimated: e.animated
		}))

		return res.json({
			emojis: filteredEmojis
		})
	}

	public static async disconnect(
		req: IAuthenticatedRequest<MeemAPI.v1.DisconnectDiscord.IDefinition>,
		res: IResponse<MeemAPI.v1.DisconnectDiscord.IResponseBody>
	): Promise<any> {
		const { agreementDiscordId } = req.body

		if (!agreementDiscordId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreementDiscord = await orm.models.AgreementDiscord.findOne({
			where: {
				id: agreementDiscordId
			},
			include: [orm.models.Discord, orm.models.Agreement]
		})

		if (
			!agreementDiscord ||
			!agreementDiscord?.Discord?.guildId ||
			!agreementDiscord.Agreement
		) {
			throw new Error('DISCORD_NOT_FOUND')
		}

		const isAdmin = await agreementDiscord.Agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		services.analytics.track([
			{
				name: Events.DiscordBotDisconnected,
				agreementId: agreementDiscord.AgreementId,
				params: {
					guildId: agreementDiscord.Discord.guildId as string
				}
			}
		])

		await Promise.all([
			agreementDiscord.destroy()
			// orm.models.Rule.destroy({
			// 	where: {
			// 		agreementId
			// 	}
			// })
		])

		return res.json({
			status: 'success'
		})
	}

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
