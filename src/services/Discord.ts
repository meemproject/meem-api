/* eslint-disable no-await-in-loop */
import {
	ActionRowBuilder,
	BaseMessageOptions,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CacheType,
	ChatInputCommandInteraction,
	Client,
	ClientOptions,
	ComponentType,
	Events as DiscordEvents,
	Guild,
	IntentsBitField,
	Interaction,
	Message,
	MessagePayload,
	MessageReaction,
	PartialMessageReaction,
	Partials,
	REST,
	TextChannel
} from 'discord.js'
import _ from 'lodash'
import { Op } from 'sequelize'
import request from 'superagent'
import type Rule from '../models/Rule'
import { MeemAPI } from '../types/meem.generated'
import { Events } from './Analytics'

export default class Discord {
	public static shouldInitialize = true

	public client: Client

	public restClient: REST

	public constructor(options?: ClientOptions) {
		this.client = new Client({
			// partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
			partials: [Partials.Channel, Partials.Message, Partials.Reaction],
			intents: [
				IntentsBitField.Flags.DirectMessages,
				IntentsBitField.Flags.DirectMessageReactions,
				IntentsBitField.Flags.GuildMessages,
				IntentsBitField.Flags.GuildMessageReactions,
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.MessageContent
			],
			...options
		})

		this.restClient = new REST()
		this.restClient.setToken(config.DISCORD_APP_TOKEN)

		this.setupListeners()

		this.client.login(config.DISCORD_APP_TOKEN)
	}

	public isReady() {
		return this.client.isReady()
	}

	public async sendMessage(options: {
		channelId: string
		message: string | MessagePayload | BaseMessageOptions
	}) {
		const { channelId, message } = options
		const channel = await this.client.channels.fetch(channelId)
		if (!channel) {
			throw new Error('CHANNEL_NOT_FOUND')
		}

		await (channel as TextChannel).send(message)
	}

	public async joinChannel(options: { guildId: string; channelId: string }) {
		const { guildId, channelId } = options
		const [channel, guild] = await Promise.all([
			this.client.channels.fetch(channelId),
			this.client.guilds.fetch(guildId)
		])
		if (!guild || !channel) {
			throw new Error('CHANNEL_NOT_FOUND')
		}

		await guild.roles.fetch()
		const role = guild.roles.cache.find(
			r => r.name === config.DISCORD_BOT_ROLE_NAME
		)

		if (!role) {
			throw new Error('ROLE_NOT_FOUND')
		}

		await (channel as TextChannel).permissionOverwrites.create(role, {
			SendMessages: true,
			SendMessagesInThreads: true,
			ViewChannel: true,
			AddReactions: true,
			CreatePublicThreads: true
		})
	}

	public async getChannels(guildId: string) {
		const guild = await this.client.guilds.fetch(guildId)

		const channels = guild.channels.cache
			.filter(channel => channel.type === 0)
			.map(c => {
				let canSend = false
				let canView = false
				if (guild.members.me?.user) {
					const perms = c.permissionsFor(guild.members.me?.user)
					canSend = !!perms?.has('SendMessages')
					canView = !!perms?.has('ViewChannel')
				}

				return {
					id: c.id,
					name: c.name,
					canSend,
					canView
				}
			})

		return channels
	}

	public async getRoles(guildId: string) {
		const guild = await this.client.guilds.fetch(guildId)

		const roles = await guild.roles.fetch()

		return roles
	}

	public getMessageComponents(
		buttons?: { ctaText: string; slug?: string; url?: string }[]
	) {
		let actionRows: ActionRowBuilder<ButtonBuilder>[] = []
		let components: ButtonBuilder[] = []
		let numButtons = 0

		if (buttons && buttons.length > 0) {
			buttons.forEach(button => {
				const { ctaText, slug, url } = button
				if (numButtons > 4) {
					actionRows.push(
						new ActionRowBuilder<ButtonBuilder>({
							type: ComponentType.ActionRow
						}).addComponents(components)
					)
					numButtons = 0
					components = []
				}

				if ((slug || url) && ctaText) {
					components.push(
						new ButtonBuilder()
							.setLabel(ctaText)
							.setURL(url ?? `${process.env.MEEM_APP_URL}/${slug}`)
							.setStyle(ButtonStyle.Link)
					)
				}

				numButtons++
			})

			actionRows.push(
				new ActionRowBuilder<ButtonBuilder>({
					type: ComponentType.ActionRow
				}).addComponents(components)
			)
		}

		// Discord supports maximum 5 action rows w/ 5 buttons each
		actionRows = actionRows.slice(0, 4)

		return [
			...actionRows,
			new ActionRowBuilder<ButtonBuilder>({
				type: ComponentType.ActionRow
			}).addComponents(
				new ButtonBuilder()
					.setLabel('Need Help?')
					.setURL('https://support.meem.wtf')
					.setStyle(ButtonStyle.Link)
			)
		]
	}

	public async authenticate(data: {
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

	public async getDiscordGuilds(data: { accessToken: string }): Promise<any[]> {
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
					const [guildDataResult, platformDataResult] = await Promise.all([
						request.post(`https://Meemapi.guild.xyz/v1/discord/server/${g.id}`),
						request.get(
							`https://Meemapi.guild.xyz/v1/guild/platform/DISCORD/${g.id}`
						)
					])

					const guildData = {
						connectedGuildId: platformDataResult.body.id ?? null,
						...guildDataResult.body
					}

					return {
						...g,
						guildData
					}
				})
			)

			return guildsWithData ?? []
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	private async handleMessageReaction(
		reaction: MessageReaction | PartialMessageReaction
	) {
		try {
			log.debug('handleMessageReactionAdd')
			const discord = await orm.models.Discord.findOne({
				where: {
					guildId: reaction.message.guildId
				},
				include: [orm.models.AgreementDiscord]
			})

			if (
				!discord ||
				!discord.AgreementDiscords ||
				discord.AgreementDiscords.length === 0
			) {
				throw new Error('DISCORD_NOT_FOUND')
			}

			const promises: Promise<any>[] = []

			discord.AgreementDiscords.forEach(async ad => {
				if (ad.AgreementId) {
					promises.push(
						this.handleMessageReactionForAgreement({
							agreementId: ad.AgreementId,
							reaction
						})
					)
				}
			})

			const results = await Promise.allSettled(promises)
			results.forEach(result => {
				if (result.status === 'rejected') {
					log.warn(result.reason)
				}
			})
		} catch (e) {
			log.crit(e)
		}
	}

	private async handleMessageReactionForAgreement(options: {
		reaction: MessageReaction | PartialMessageReaction
		agreementId: string
	}) {
		const { reaction, agreementId } = options
		try {
			log.debug('handleMessageReactionForAgreement')

			const isHandled = await services.rule.isMessageHandled({
				agreementId,
				messageId: reaction.message.id
			})

			if (isHandled) {
				log.debug(
					`Message w/ id ${reaction.message.id} has already been handled`
				)
				return
			}

			log.debug(`Handling message for agreementId: ${agreementId}`)

			const message = await reaction.message.channel.messages.fetch(
				reaction.message.id
			)

			log.debug({ message })

			if (agreementId) {
				const rules = await orm.models.Rule.findAll({
					where: {
						input: MeemAPI.RuleIo.Discord,
						agreementId
					}
				})

				log.debug('Checking rules', { agreementId, rules })

				if (rules) {
					for (let i = 0; i < rules.length; i += 1) {
						const rule = rules[i]

						await services.rule.processRule({
							channelId: message.channelId,
							rule,
							message
						})
					}
				}
			}
		} catch (e) {
			log.crit(e)
		}
	}

	/** Counts reactions for a discord message based on a rule */
	public async countReactions(options: { rule: Rule; message: Message }) {
		const messageReactions: {
			totalApprovals: number
			totalProposers: number
			totalVetoers: number
			approver: { [unifiedEmojiCode: string]: number }
			proposer: { [unifiedEmojiCode: string]: number }
			vetoer: { [unifiedEmojiCode: string]: number }
		} = {
			totalApprovals: 0,
			totalProposers: 0,
			totalVetoers: 0,
			approver: {},
			proposer: {},
			vetoer: {}
		}

		const { rule, message } = options

		if (
			rule.definition.proposalChannels.includes('all') ||
			rule.definition.proposalChannels.includes(message.channelId) ||
			rule.definition.proposalShareChannel === message.channelId
		) {
			for (let i = 0; i < message.reactions.cache.size; i += 1) {
				const messageReaction = message.reactions.cache.at(i)
				if (messageReaction?.emoji.name) {
					const unicode = services.rule.emojiToUnicode(
						messageReaction.emoji.name
					)
					if (unicode) {
						log.debug('Checking reaction', {
							name: messageReaction.emoji.name,
							unicode
						})
						const isApproverEmoji =
							(rule.definition.publishType ===
								MeemAPI.PublishType.PublishImmediately ||
								(rule.definition.publishType === MeemAPI.PublishType.Proposal &&
									rule.definition.proposalShareChannel ===
										message.channelId)) &&
							rule.definition.approverEmojis &&
							rule.definition.approverEmojis.includes(unicode)
						const isProposerEmoji =
							rule.definition.publishType === MeemAPI.PublishType.Proposal &&
							rule.definition.proposalShareChannel !== message.channelId &&
							rule.definition.proposerEmojis &&
							rule.definition.proposerEmojis.includes(unicode)
						const isVetoerEmoji =
							rule.definition.vetoerEmojis &&
							rule.definition.vetoerEmojis.includes(unicode)

						log.debug({
							isApproverEmoji,
							isProposerEmoji,
							isVetoerEmoji
						})

						if (isApproverEmoji || isProposerEmoji || isVetoerEmoji) {
							// Valid emoji to count
							await messageReaction?.users.fetch()

							log.debug('Found valid emoji reaction. Checking user roles')
							// Now count the number of users that have a valid role
							messageReaction?.users.cache.forEach(u => {
								const member = message.guild?.members.cache.get(u.id)

								log.debug('Member roles', {
									roles: member?.roles.cache
								})

								member?.roles.cache.forEach(role => {
									if (
										isApproverEmoji &&
										rule.definition.approverRoles.includes(role.id)
									) {
										if (!messageReactions.approver[unicode]) {
											messageReactions.approver[unicode] = 0
										}
										messageReactions.approver[unicode] += 1
									} else if (
										isProposerEmoji &&
										rule.definition.proposerRoles.includes(role.id)
									) {
										if (!messageReactions.proposer[unicode]) {
											messageReactions.proposer[unicode] = 0
										}
										messageReactions.proposer[unicode] += 1
									} else if (
										isVetoerEmoji &&
										rule.definition.vetoerRoles.includes(role.id)
									) {
										if (!messageReactions.vetoer[unicode]) {
											messageReactions.vetoer[unicode] = 0
										}
										messageReactions.vetoer[unicode] += 1
									}
								})
							})
						}
					} else {
						log.warn(
							`No unicode found for emoji: ${messageReaction.emoji.name}`
						)
					}
				}
			}
		}

		const totalApprovals = Object.values(messageReactions.approver).reduce(
			(acc, curr) => acc + curr,
			0
		)

		const totalProposers = Object.values(messageReactions.proposer).reduce(
			(acc, curr) => acc + curr,
			0
		)

		const totalVetoers = Object.values(messageReactions.vetoer).reduce(
			(acc, curr) => acc + curr,
			0
		)

		return {
			totalApprovals,
			totalProposers,
			totalVetoers,
			messageReactions
		}
	}

	private async handleGuildDelete(guild: Guild) {
		log.debug('Discord handleGuildDelete!', {
			guild
		})

		// Bot was kicked from the server or the server was deleted
		const discord = await orm.models.Discord.findOne({
			where: {
				guildId: guild.id
			}
		})

		if (!discord) {
			// No record of this discord...ignore
			log.debug(
				`Unable to find discord w/ guildId: ${guild.id} for guild delete event`
			)
			return
		}

		services.analytics.track([
			{
				name: Events.DiscordBotKicked,
				params: {
					guildId: guild.id
				}
			}
		])

		await orm.models.AgreementDiscord.destroy({
			where: {
				DiscordId: discord.id
			}
		})

		await discord.destroy()
	}

	private async handleCommandInteraction(
		interaction: ChatInputCommandInteraction<CacheType>
	) {
		switch (interaction.commandName) {
			case 'activate': {
				await interaction.deferReply()
				const code = interaction.options.getString('code')
				if (!code) {
					await interaction.editReply(
						'Unable to find a `code`. Please try again.'
					)
					return
				}

				const [agreementDiscord, currentDiscord] = await Promise.all([
					orm.models.AgreementDiscord.findOne({
						where: {
							code
						}
					}),
					orm.models.Discord.findOne({
						where: {
							guildId: interaction.guildId
						}
					})
				])

				let discord = currentDiscord

				if (!discord) {
					discord = orm.models.Discord.build()
				}

				// if (currentDiscord && discord?.id !== currentDiscord?.id) {
				// 	const agreement = await services.meem.getAgreementById(
				// 		currentDiscord.agreementId
				// 	)

				// 	await interaction.editReply({
				// 		content: `This discord server is already associated with a different account. To change agreements you'll need to disconnect it first.`,
				// 		components: this.getMessageComponents({
				// 			slug: agreement?.slug,
				// 			ctaText: 'Manage Connection'
				// 		})
				// 	})
				// 	break
				// }

				if (agreementDiscord) {
					const agreement = await orm.models.Agreement.findOne({
						where: {
							id: agreementDiscord.AgreementId
						}
					})
					agreementDiscord.code = null
					agreementDiscord.DiscordId = discord.id
					discord.guildId = interaction.guildId
					discord.name = interaction.guild?.name
					discord.icon = interaction.guild?.iconURL({ size: 256 })
					await Promise.all([agreementDiscord.save(), discord.save()])

					await interaction.editReply({
						content: `Greetings, I’m Symphony Bot! \n\nI can help automate publishing for your community by allowing you to vote on what gets posted to your shared Twitter account.\n\nTap below to set up your publishing logic.`,
						components: this.getMessageComponents([
							{
								slug: agreement?.slug,
								ctaText: 'Manage Rules'
							}
						])
					})

					services.analytics.track([
						{
							name: Events.DiscordBotActivated,
							agreementId: agreementDiscord.AgreementId,
							params: {
								guildId: interaction.guildId as string
							}
						}
					])
				} else {
					log.warn(`No discord found for code: ${code}`)
					await interaction.editReply(
						"I don't have a record of that code. Check your settings and try again."
					)
				}

				break
			}

			case 'rules': {
				await interaction.deferReply()
				const discord = await orm.models.Discord.findOne({
					where: {
						guildId: interaction.guildId
					},
					include: [orm.models.AgreementDiscord]
				})

				if (!discord || !interaction.guildId) {
					await interaction.editReply('Symphony needs to be activated')
					return
				}

				const rules = await orm.models.Rule.findAll({
					where: {
						input: MeemAPI.RuleIo.Discord,
						inputRef: discord.id
					}
				})

				const agreementIds = _.uniq(rules.map(r => r.AgreementId))

				const agreements = await orm.models.Agreement.findAll({
					where: {
						id: {
							[Op.in]: agreementIds
						}
					}
				})

				const channelRules = rules.filter(
					r =>
						r.definition.proposalChannels.includes(interaction.channelId) ||
						r.definition.proposalChannels.includes('all') ||
						r.definition.proposalShareChannel === interaction.channelId
				)

				let rulesTxt = ''

				if (channelRules.length > 0) {
					rulesTxt = channelRules
						.map((rule, i) => `${i + 1}) ${rule.description}`)
						.join('\n\n')
				}

				const content =
					rules.length > 0
						? `There ${rules.length === 1 ? 'is' : 'are'} ${rules.length} ${
								rules.length === 1 ? 'total rule' : 'total rules'
						  } and ${channelRules.length} ${
								channelRules.length === 1 ? 'rule' : 'rules'
						  } in this channel:\n\n${rulesTxt}`
						: 'No publishing rules have been set up. Create one now!'

				const buttons: {
					slug: string
					ctaText: string
				}[] = []

				agreements.forEach(agreement => {
					if (agreement && agreement.slug) {
						buttons.push({
							slug: agreement.slug,
							ctaText: `Manage Rules (${agreement.name})`
						})
					}
				})

				await interaction.editReply({
					content,
					components: this.getMessageComponents(buttons)
				})

				services.analytics.track([
					{
						name: Events.DiscordSlashRules,
						// agreementId: discord.agreementId,
						params: {
							guildId: interaction.guildId as string
						}
					}
				])

				break
			}

			default:
				log.warn(`Unknown command: ${interaction.commandName}`)
				await interaction.reply(`Unknown command: ${interaction.commandName}`)
				break
		}
	}

	private async handleButtonInteraction(
		interaction: ButtonInteraction<CacheType>
	) {
		// await interaction.
		switch (interaction.customId) {
			case 'help': {
				break
			}

			case 'setRules': {
				break
			}

			default: {
				await interaction.editReply("Sorry, I'm not sure what to do.")
				break
			}
		}
	}

	private async handleInteraction(interaction: Interaction<CacheType>) {
		if (interaction.isChatInputCommand()) {
			await this.handleCommandInteraction(interaction)
		} else if (interaction.isButton()) {
			await this.handleButtonInteraction(interaction)
		} else {
			log.warn('Unknown discord interaction')
			// eslint-disable-next-line no-console
			console.log({ interaction })
		}
	}

	private setupListeners() {
		this.client.on('ready', () => {
			log.info('Discord client is ready!')
		})
		// this.client.on(
		// 	DiscordEvents.MessageCreate,
		// 	this.handleMessageCreate.bind(this)
		// )
		this.client.on(
			DiscordEvents.MessageReactionAdd,
			this.handleMessageReaction.bind(this)
		)
		this.client.on(
			DiscordEvents.MessageReactionRemove,
			this.handleMessageReaction.bind(this)
		)
		this.client.on(
			DiscordEvents.MessageReactionRemoveEmoji,
			this.handleMessageReaction.bind(this)
		)
		// this.client.on(
		// 	DiscordEvents.MessageReactionRemoveAll,
		// 	this.handleMessageReactionRemoveAll.bind(this)
		// )
		// this.client.on(DiscordEvents.GuildCreate, guild => {
		// 	log.debug('guildCreate', guild)
		// })
		this.client.on(
			DiscordEvents.InteractionCreate,
			this.handleInteraction.bind(this)
		)
		this.client.on(DiscordEvents.GuildDelete, this.handleGuildDelete.bind(this))
	}
}
