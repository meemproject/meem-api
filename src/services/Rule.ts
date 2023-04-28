import { Message as SlackMessage } from '@slack/web-api/dist/response/ConversationsHistoryResponse'
import {
	Message as DiscordMessage,
	ChannelType as DiscordChannelType
} from 'discord.js'
import request from 'superagent'
import slackEmojis from '../lib/slackEmojis.json'
import Agreement from '../models/Agreement'
import AgreementDiscord from '../models/AgreementDiscord'
import AgreementSlack from '../models/AgreementSlack'
import AgreementTwitter from '../models/AgreementTwitter'
import Rule from '../models/Rule'
import Slack from '../models/Slack'
import { MeemAPI } from '../types/meem.generated'

export type IOModel =
	| AgreementDiscord
	| AgreementTwitter
	| AgreementSlack
	| string
	| null
	| undefined

export default class RuleService {
	public static async isMessageHandled(options: {
		messageId?: string | null
		agreementId?: string | null
	}) {
		const { agreementId, messageId } = options

		const message = await orm.models.Message.findOne({
			where: {
				AgreementId: agreementId,
				messageId
			}
		})

		if (message) {
			return true
		}

		return false
	}

	public static async processRule(options: {
		channelId: string
		rule: Rule
		message: SlackMessage | DiscordMessage
	}) {
		const { channelId, rule, message } = options

		if (!rule.input || !rule.output) {
			log.crit(`Rule ${rule.id} has no input or output`)
			return
		}

		log.debug({ message })

		const messageId =
			(message as DiscordMessage).id ?? (message as SlackMessage).ts

		let parentChannelId: string | undefined

		let totalApprovals = 0
		let totalProposers = 0
		let totalVetoers = 0
		let totalEditors = 0
		let messageContent = ''

		switch (rule.input) {
			case MeemAPI.RuleIo.Slack:
				{
					const r = services.slack.countReactions({
						message: message as SlackMessage,
						rule,
						channelId
					})
					totalApprovals = r.totalApprovals
					totalProposers = r.totalProposers
					totalVetoers = r.totalVetoers
					messageContent = (message as SlackMessage).text ?? ''
				}
				break

			case MeemAPI.RuleIo.Discord:
				{
					const discordMessage = message as DiscordMessage
					const r = await services.discord.countReactions({
						message: message as DiscordMessage,
						rule
					})
					totalApprovals = r.totalApprovals
					totalProposers = r.totalProposers
					totalVetoers = r.totalVetoers
					totalEditors = r.totalEditors
					messageContent = discordMessage.content
					discordMessage.mentions.users.forEach(u => {
						messageContent = messageContent.replace(`<@${u.id}>`, `${u.tag}`)
					})

					if (
						discordMessage.channel.type === DiscordChannelType.PublicThread &&
						discordMessage.channel.parent?.type ===
							DiscordChannelType.GuildForum
					) {
						parentChannelId = discordMessage.channel.parent.id
					}
				}
				break

			default:
				log.warn(`Input not supported for ${rule.input}`)
				break
		}

		const ruleResult = services.rule.evaluateRule({
			rule,
			channelId: parentChannelId ?? channelId,
			totalApprovals,
			totalProposers,
			totalVetoers,
			totalEditors
		})

		log.debug({
			ruleResult,
			totalApprovals,
			totalProposers,
			totalVetoers
		})

		const { shouldPublish } = ruleResult
		const { shouldMarkAsHandled } = ruleResult

		// const ms = message as SlackMessage
		// const md = message as DiscordMessage

		// ms.attachments

		if (shouldPublish) {
			switch (rule.output) {
				case MeemAPI.RuleIo.Twitter: {
					if (!rule.outputRef) {
						log.crit('No outputRef for twitter rule', { rule })
						break
					}
					const result = await services.twitter.sendTweet({
						agreementTwitterId: rule.outputRef,
						body: messageContent
					})
					if (result.data?.id && result.username) {
						await this.sendInputReply({
							rule,
							channelId,
							message,
							content: `This message has enough votes and has been tweeted!\n\nhttps://twitter.com/${result.username}/status/${result.data.id}`
						})
					}
					break
				}

				case MeemAPI.RuleIo.Webhook: {
					if (!rule.webhookUrl || !rule.webhookSecret) {
						log.crit('No webhookUrl or webhookSecret for webhook rule', {
							rule
						})
						break
					}

					let partialResponse: Partial<MeemAPI.IWebhookBody> & {
						reactions: MeemAPI.IWebhookReaction[]
						createdTimestamp?: number
						attachments: MeemAPI.IWebhookAttachment[]
					} = {
						reactions: [],
						attachments: []
					}

					const attachments: MeemAPI.IWebhookAttachment[] = []

					if (typeof (message as DiscordMessage).guildId === 'string') {
						partialResponse = services.discord.parseMessageForWebhook(
							message as DiscordMessage
						)
						// const m = message as DiscordMessage
						// partialResponse.messageId = m.id
						// partialResponse.createdTimestamp = m.createdTimestamp
						// m.reactions.cache.forEach(r => {
						// 	if (r.emoji.name) {
						// 		partialResponse.reactions.push({
						// 			name: r.emoji.name,
						// 			emoji: r.emoji.name,
						// 			unicode: this.emojiToUnicode(r.emoji.name),
						// 			count: r.count
						// 		})
						// 	}
						// })

						// partialResponse.user = {
						// 	id: m.author.id,
						// 	username: m.author.username
						// }

						// m.embeds.forEach(a => {
						// 	attachments.push({
						// 		url: a.url,
						// 		name: a.title,
						// 		description: a.description
						// 	})
						// })

						// m.attachments?.forEach(a => {
						// 	attachments.push({
						// 		url: a.url,
						// 		mimeType: a.contentType,
						// 		width: a.width,
						// 		height: a.height,
						// 		name: a.name,
						// 		description: a.description
						// 	})
						// })
					} else if (typeof (message as SlackMessage).team === 'string') {
						const m = message as SlackMessage
						partialResponse.messageId = m.ts

						const slack = await orm.models.Slack.findOne({
							where: {
								teamId: m.team
							}
						})

						if (!slack) {
							throw new Error('SLACK_NOT_FOUND')
						}
						if (m.user) {
							try {
								const user = await services.slack.getUser({
									slack,
									userId: m.user
								})
								partialResponse.user = {
									id: user?.id,
									username: user?.name,
									realName: user?.real_name,
									isAdmin: user?.is_admin,
									isOwner: user?.is_owner,
									locale: user?.locale,
									timezone: user?.tz
								}
							} catch (e) {
								log.warn('Failed to get slack user')
								// eslint-disable-next-line no-console
								console.log(e)
							}
						}

						partialResponse.createdTimestamp = m.ts ? +m.ts : 0

						m.reactions?.forEach(r => {
							if (r.name) {
								const emojiData = slackEmojis.find(e => e.short_name === r.name)
								const unicode: string | undefined =
									emojiData?.unified?.toLowerCase()
								const emoji = unicode
									? String.fromCodePoint(parseInt(unicode, 16))
									: undefined
								partialResponse.reactions.push({
									name: r.name,
									emoji,
									unicode,
									count: r.count ?? 0
								})
							}
						})
						m.files?.forEach(a => {
							attachments.push({
								url: a.url_private,
								mimeType: a.mimetype,
								width: a.original_w ? +a.original_w : undefined,
								height: a.original_h ? +a.original_h : undefined,
								name: a.title
							})
						})
						m.attachments?.forEach(a => {
							attachments.push({
								url: a.url,
								mimeType: a.mimetype,
								width: a.image_width,
								height: a.image_height,
								name: a.title
							})
						})
					} else {
						log.crit('Message is not a DiscordMessage or SlackMessage', {
							message
						})
						return
					}

					try {
						const body: MeemAPI.IWebhookBody = {
							...partialResponse,
							messageId: partialResponse.messageId ?? '',
							secret: rule.webhookSecret,
							// attachments,
							channelId,
							channelName: partialResponse.channelName,
							totalApprovals,
							totalProposers,
							totalVetoers,
							rule: {
								...rule.definition,
								input: rule.input,
								output: rule.output,
								inputRef: rule.inputRef,
								outputRef: rule.outputRef
							},
							content: messageContent
						}
						log.debug('Sending webhook', body)
						await request.post(rule.webhookUrl).timeout(5000).send(body)
						await this.sendInputReply({
							rule,
							channelId,
							message,
							content: `This message has enough votes and has been sent to a webhook`
						})
					} catch (e) {
						log.crit(e)
						await this.sendInputReply({
							rule,
							channelId,
							message,
							content: `This message has enough votes but the webhook failed`
						})
					}

					break
				}

				default:
					log.warn(`Output not supported for ${rule.output}`)
					break
			}
		} else {
			log.debug('Not publishing for rule', { rule })
		}

		if (shouldMarkAsHandled) {
			log.debug(`Marking message as handled: ${messageId}`)
			await orm.models.Message.create({
				AgreementId: rule.AgreementId,
				messageId,
				inputType: rule.input,
				status: MeemAPI.MessageStatus.Handled
			})
		}
	}

	public static async sendInputReply(options: {
		channelId: string
		rule: Rule
		message: SlackMessage | DiscordMessage
		content: string
	}) {
		const { channelId, rule, message, content } = options

		switch (rule.input) {
			case MeemAPI.RuleIo.Slack: {
				const slack = await orm.models.Slack.findOne({
					include: [
						{
							model: orm.models.AgreementSlack,
							where: {
								id: rule.inputRef
							}
						}
					]
				})
				if (!slack) {
					log.crit(`Unable to find slack for rule: ${rule.id}`)
					return
				}
				try {
					await services.slack.sendMessage({
						content,
						slack,
						channelIds: [channelId]
					})
				} catch (e) {
					log.crit(e)
					throw e
				}
				break
			}

			case MeemAPI.RuleIo.Discord: {
				try {
					await (message as DiscordMessage).reply(content)
				} catch (e) {
					log.crit(e)
					throw e
				}
				break
			}

			default:
				log.warn(`Output not supported for ${rule.output}`)
				break
		}
	}

	public static evaluateRule(options: {
		channelId: string
		rule: Rule
		totalApprovals: number
		totalProposers: number
		totalVetoers: number
		totalEditors?: number
	}) {
		const {
			channelId,
			rule,
			totalApprovals,
			totalProposers,
			totalVetoers,
			totalEditors
		} = options
		let shouldPublish = false
		let shouldMarkAsHandled = false

		if (
			rule.definition.publishType === MeemAPI.PublishType.PublishImmediately &&
			(rule.definition.proposalChannels.includes(channelId) ||
				rule.definition.proposalChannels.includes('all')) &&
			totalApprovals >= rule.definition.votes &&
			(!rule.definition.canVeto ||
				(rule.definition.vetoVotes && totalVetoers < rule.definition.vetoVotes))
		) {
			log.debug('Rule matched publish immediately')
			// Publish it
			shouldPublish = true
			shouldMarkAsHandled = true
		} else if (
			rule.definition.publishType ===
				MeemAPI.PublishType.PublishAfterApproval &&
			(rule.definition.proposalChannels.includes(channelId) ||
				rule.definition.proposalChannels.includes('all')) &&
			totalApprovals >= rule.definition.votes &&
			totalEditors &&
			rule.definition.editorVotes &&
			totalEditors >= rule.definition.editorVotes &&
			(!rule.definition.canVeto ||
				(rule.definition.vetoVotes && totalVetoers < rule.definition.vetoVotes))
		) {
			log.debug('Rule matched publish after approval')
			// Publish it
			shouldPublish = true
			shouldMarkAsHandled = true
		} else if (
			rule.definition.publishType ===
				MeemAPI.PublishType.PublishImmediatelyOrEditorApproval &&
			(rule.definition.proposalChannels.includes(channelId) ||
				rule.definition.proposalChannels.includes('all')) &&
			(totalApprovals >= rule.definition.votes ||
				(totalEditors &&
					rule.definition.editorVotes &&
					totalEditors >= rule.definition.editorVotes)) &&
			(!rule.definition.canVeto ||
				(rule.definition.vetoVotes && totalVetoers < rule.definition.vetoVotes))
		) {
			log.debug('Rule matched publish immediately or after approval')
			// Publish it
			shouldPublish = true
			shouldMarkAsHandled = true
		} else if (
			rule.definition.publishType === MeemAPI.PublishType.Proposal &&
			rule.definition.proposalShareChannel === channelId &&
			totalApprovals >= rule.definition.votes &&
			(!rule.definition.canVeto ||
				(rule.definition.vetoVotes && totalVetoers < rule.definition.vetoVotes))
		) {
			log.debug('Rule matched proposal approved')
			shouldPublish = true
			shouldMarkAsHandled = true
		} else if (
			rule.definition.publishType === MeemAPI.PublishType.Proposal &&
			rule.definition.proposalShareChannel !== channelId &&
			(rule.definition.proposalChannels.includes(channelId) ||
				rule.definition.proposalChannels.includes('all')) &&
			totalProposers >= rule.definition.proposeVotes &&
			(!rule.definition.canVeto ||
				(rule.definition.vetoVotes && totalVetoers < rule.definition.vetoVotes))
		) {
			log.warn('DEPRECATED: Rule matched proposal created.')
			shouldMarkAsHandled = true
		} else {
			log.debug('No matching rule', {
				rule,
				channelId,
				totalApprovals,
				totalProposers,
				totalVetoers
			})
		}

		return {
			shouldPublish,
			shouldMarkAsHandled
		}
	}

	public static async sendRuleNotification(options: {
		rule: Rule
		agreement: Agreement
	}) {
		const { rule, agreement } = options

		const io = await this.getRuleIO({ rule })

		const promises: Promise<any>[] = []

		switch (rule.input) {
			case MeemAPI.RuleIo.Discord: {
				for (let j = 0; j < rule.definition.proposalChannels.length; j += 1) {
					const channelId = rule.definition.proposalChannels[j]
					promises.push(
						services.discord.sendMessage({
							channelId,
							message: {
								content: rule.description ?? '',
								components: services.discord.getMessageComponents([
									{
										slug: agreement?.slug,
										ctaText: 'Manage Rules'
									}
								])
							}
						})
					)
				}
				break
			}

			case MeemAPI.RuleIo.Slack: {
				promises.push(
					services.slack.sendMessage({
						channelIds: rule.definition.proposalChannels,
						content: rule.description ?? 'Rule created',
						slack: (io.input as AgreementSlack).Slack as Slack
					})
				)
				break
			}

			default:
				log.warn('Rule input not supported')
				break
		}

		await Promise.all(promises)
	}

	public static async getRuleIO(options: { rule: MeemAPI.IRuleToSave | Rule }) {
		const { rule } = options

		// let inputModel: IOModel
		// let outputModel: IOModel
		const promises: Promise<IOModel>[] = []

		switch (rule.input) {
			case MeemAPI.RuleIo.Discord:
				promises.push(
					orm.models.AgreementDiscord.findOne({
						where: {
							id: rule.inputRef
						},
						include: [
							{
								model: orm.models.Discord
							}
						]
					})
				)
				break

			case MeemAPI.RuleIo.Twitter:
				promises.push(
					orm.models.AgreementTwitter.findOne({
						where: {
							id: rule.inputRef
						},
						include: [
							{
								model: orm.models.Twitter
							}
						]
					})
				)
				break

			case MeemAPI.RuleIo.Slack:
				promises.push(
					orm.models.AgreementSlack.findOne({
						where: {
							id: rule.inputRef
						},
						include: [
							{
								model: orm.models.Slack
							}
						]
					})
				)
				break

			// case MeemAPI.RuleIo.Webhook:
			// 	promises.push(Promise.resolve(rule.webhookUrl))
			// 	break

			default:
				throw new Error('INVALID_INPUT')
		}

		switch (rule.output) {
			case MeemAPI.RuleIo.Discord:
				promises.push(
					orm.models.AgreementDiscord.findOne({
						where: {
							id: rule.outputRef
						},
						include: [
							{
								model: orm.models.Discord
							}
						]
					})
				)
				break

			case MeemAPI.RuleIo.Twitter:
				promises.push(
					orm.models.AgreementTwitter.findOne({
						where: {
							id: rule.outputRef
						},
						include: [
							{
								model: orm.models.Twitter
							}
						]
					})
				)
				break

			case MeemAPI.RuleIo.Slack:
				promises.push(
					orm.models.AgreementSlack.findOne({
						where: {
							id: rule.outputRef
						},
						include: [
							{
								model: orm.models.Slack
							}
						]
					})
				)
				break

			case MeemAPI.RuleIo.Webhook:
				promises.push(Promise.resolve(rule.webhookUrl))
				break

			default:
				throw new Error('INVALID_INPUT')
		}

		const result = await Promise.all(promises)

		return {
			input: result[0],
			output: result[1]
		}
	}

	public static async getRuleText(options: { rule: Rule }) {
		const { rule } = options
		let inputPart1 = ''
		let inputPart2 = ''
		let outputPart1 = ''
		let outputPart2 = ''

		switch (rule.input) {
			case MeemAPI.RuleIo.Discord: {
				const agreementDiscord = await orm.models.AgreementDiscord.findOne({
					where: {
						id: rule.inputRef
					},
					include: [orm.models.Discord]
				})

				const discord = agreementDiscord?.Discord

				if (!discord || !discord.guildId) {
					throw new Error('DISCORD_NOT_FOUND')
				}

				const [roles] = await Promise.all([
					services.discord.getRoles(discord.guildId)
				])

				const approverRoleNames = rule.definition.approverRoles.map(ar => {
					if (ar === 'all') {
						return 'everyone'
					}

					const role = roles.find(r => r.id === ar)

					return role?.name ?? ''
				})

				const emojis = rule.definition.approverEmojis.map(e =>
					this.emojiToSymbol(e)
				)

				inputPart1 += `When someone shares a new post in this channel, people with the ${this.listItemsToString(
					approverRoleNames
				)} role${approverRoleNames.length > 1 ? 's' : ''} can vote`

				inputPart2 += `by using the following emoji: ${emojis.join(
					'  '
				)}. Once ${rule.definition.votes} ${
					rule.definition.votes > 1 ? 'votes have' : 'vote has'
				} been made, the post`

				if (rule.definition.canVeto) {
					const vetoerRoleNames = rule.definition.vetoerRoles.map(ar => {
						if (ar === 'all') {
							return 'everyone'
						}

						const role = roles.find(r => r.id === ar)

						return role?.name ?? ''
					})

					const vetoEmojis = rule.definition.vetoerEmojis
						.map(e => this.emojiToSymbol(e))
						.join('  ')

					inputPart2 += `\n\nPeople with the ${this.listItemsToString(
						vetoerRoleNames
					)} role${
						vetoerRoleNames.length > 1 ? 's' : ''
					} can also veto proposed tweets using the following emoji: ${vetoEmojis}. ${
						rule.definition.vetoVotes
					} veto vote${
						rule.definition.vetoVotes > 1 ? 's' : ''
					} must be made before a proposed tweet is rejected.`
				}

				break
			}

			case MeemAPI.RuleIo.Slack: {
				const agreementSlack = await orm.models.AgreementSlack.findOne({
					where: {
						id: rule.inputRef
					},
					include: [orm.models.Slack]
				})

				const slack = agreementSlack?.Slack

				if (!slack) {
					throw new Error('SLACK_NOT_FOUND')
				}

				const emojis = rule.definition.approverEmojis.map(e =>
					this.emojiToSymbol(e)
				)

				inputPart1 += `When someone shares a new post in this channel, people can vote`

				inputPart2 += `by using the following emoji: ${emojis.join(
					'  '
				)}. Once ${rule.definition.votes} ${
					rule.definition.votes > 1 ? 'votes have' : 'vote has'
				} been made, the post`

				if (rule.definition.canVeto) {
					const vetoEmojis = rule.definition.vetoerEmojis
						.map(e => this.emojiToSymbol(e))
						.join('  ')

					inputPart2 += `\n\nPeople can also veto proposed tweets using the following emoji: ${vetoEmojis}. ${
						rule.definition.vetoVotes
					} veto vote${
						rule.definition.vetoVotes > 1 ? 's' : ''
					} must be made before a proposed tweet is rejected.`
				}

				break
			}

			default:
				break
		}

		switch (rule.output) {
			case MeemAPI.RuleIo.Twitter: {
				const agreementTwitter = await orm.models.AgreementTwitter.findOne({
					where: {
						id: rule.outputRef
					},
					include: [orm.models.Twitter]
				})

				const twitter = agreementTwitter?.Twitter

				if (!twitter || !twitter.username) {
					throw new Error('TWITTER_NOT_FOUND')
				}

				outputPart1 += `to tweet it from your community's Twitter account (\`@${twitter.username}\`) `
				outputPart2 += 'will automatically be tweeted.'
				break
			}

			case MeemAPI.RuleIo.Webhook: {
				outputPart1 += `to post it to a webhook`
				outputPart2 += 'will automatically be sent via webhook.'
				break
			}

			default:
				break
		}

		return `${inputPart1} ${outputPart1} ${inputPart2} ${outputPart2}`
	}

	public static async getAbridgedRuleText(options: { rule: Rule }) {
		const { rule } = options

		let message = ''

		switch (rule.input) {
			case MeemAPI.RuleIo.Discord: {
				const agreementDiscord = await orm.models.AgreementDiscord.findOne({
					where: {
						id: rule.inputRef
					},
					include: [orm.models.Discord]
				})

				const discord = agreementDiscord?.Discord

				if (!discord || !discord.guildId) {
					throw new Error('DISCORD_NOT_FOUND')
				}

				// const [roles, channels] = await Promise.all([
				// 	services.discord.getRoles(discord.guildId),
				// 	services.discord.getChannels(discord.guildId)
				// ])
				const [roles] = await Promise.all([
					services.discord.getRoles(discord.guildId)
				])

				const approverRoleNames = rule.definition.approverRoles.map(ar => {
					if (ar === 'all') {
						return 'everyone'
					}

					const role = roles.find(r => r.id === ar)

					return role?.name ?? ''
				})

				const emojis = rule.definition.approverEmojis.map(e =>
					this.emojiToSymbol(e)
				)

				message += `People with the ${this.listItemsToString(
					approverRoleNames
				)} role${
					approverRoleNames.length > 1 ? 's' : ''
				} can vote using the following emoji: ${emojis.join('  ')} with ${
					rule.definition.votes
				} ${rule.definition.votes > 1 ? 'votes' : 'vote'} required.`

				if (rule.definition.canVeto) {
					const vetoerRoleNames = rule.definition.vetoerRoles.map(ar => {
						if (ar === 'all') {
							return 'everyone'
						}

						const role = roles.find(r => r.id === ar)

						return role?.name ?? ''
					})

					const vetoEmojis = rule.definition.vetoerEmojis
						.map(e => this.emojiToSymbol(e))
						.join('  ')

					message += `\n\nPeople with the ${this.listItemsToString(
						vetoerRoleNames
					)} role${
						vetoerRoleNames.length > 1 ? 's' : ''
					} can veto using the following emoji: ${vetoEmojis}. ${
						rule.definition.vetoVotes
					} veto ${
						rule.definition.vetoVotes > 1 ? 'votes are' : 'vote is'
					} required`
				}
				break
			}

			case MeemAPI.RuleIo.Slack: {
				const agreementSlack = await orm.models.AgreementSlack.findOne({
					where: {
						id: rule.inputRef
					},
					include: [orm.models.Slack]
				})

				const slack = agreementSlack?.Slack

				if (!slack) {
					throw new Error('DISCORD_NOT_FOUND')
				}

				const emojis = rule.definition.approverEmojis.map(e =>
					this.emojiToSymbol(e)
				)

				message += `People can vote using the following emoji: ${emojis.join(
					'  '
				)} with ${rule.definition.votes} ${
					rule.definition.votes > 1 ? 'votes' : 'vote'
				} required.`

				if (rule.definition.canVeto) {
					const vetoEmojis = rule.definition.vetoerEmojis
						.map(e => this.emojiToSymbol(e))
						.join('  ')

					message += `\n\nPeople can veto using the following emoji: ${vetoEmojis}. ${
						rule.definition.vetoVotes
					} veto ${
						rule.definition.vetoVotes > 1 ? 'votes are' : 'vote is'
					} required`
				}
				break
			}

			default:
				break
		}

		return message
	}

	public static listItemsToString(items: string[]) {
		const formattedItems = items.map(i => `\`${i[0] !== '@' ? '@' : ''}${i}\``)

		if (formattedItems.length === 0) {
			return ''
		}
		if (formattedItems.length === 1) {
			return formattedItems[0]
		}
		if (formattedItems.length === 2) {
			return `${formattedItems[0]} or ${formattedItems[1]}`
		}

		return `${formattedItems.slice(0, -1).join(', ')}, or ${
			formattedItems[formattedItems.length - 1]
		}`
	}

	public static emojiToUnicode(emoji: string) {
		const hex = emoji.codePointAt(0)?.toString(16)

		return hex
	}

	public static emojiToSymbol(emoji: string | MeemAPI.IEmoji) {
		if (typeof emoji === 'string') {
			return this.unicodeToEmoji(emoji)
		} else if (emoji.type === MeemAPI.EmojiType.Unified && emoji.unified) {
			return this.unicodeToEmoji(emoji.unified)
		}
		return `:${emoji.name}:`
	}

	public static unicodeToEmoji(unicode: string) {
		const [baseCode] = unicode.split('-')
		log.trace(`Converting unicode to emoji: ${baseCode}`)
		// @ts-ignore
		return String.fromCodePoint(`0x${baseCode}`)
	}
}
