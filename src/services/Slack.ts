import { WebClient } from '@slack/web-api'
import type { Message } from '@slack/web-api/dist/response/ConversationsHistoryResponse'
import emojiMap from 'emoji-name-map'
import { Op } from 'sequelize'
import Rule from '../models/Rule'
import Slack from '../models/Slack'
import { MeemAPI } from '../types/meem.generated'

export default class SlackService {
	public static getClient(accessToken: string) {
		return new WebClient(accessToken)
	}

	public static async getRulesText(options: {
		agreementSlackIds: string[]
		channelId?: string
	}) {
		const { agreementSlackIds, channelId } = options
		const rules = await orm.models.Rule.findAll({
			where: {
				input: MeemAPI.RuleIo.Slack,
				inputRef: {
					[Op.in]: agreementSlackIds
				}
			}
		})

		// const agreementIds = _.uniq(rules.map(r => r.AgreementId))

		// const agreements = await orm.models.Agreement.findAll({
		// 	where: {
		// 		id: {
		// 			[Op.in]: agreementIds
		// 		}
		// 	}
		// })

		const channelRules = rules.filter(
			r =>
				typeof channelId === 'undefined' ||
				r.definition.proposalChannels.includes(channelId) ||
				r.definition.proposalChannels.includes('all') ||
				r.definition.proposalShareChannel === channelId
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

		// const buttons: {
		// 	slug: string
		// 	ctaText: string
		// }[] = []

		// agreements.forEach(agreement => {
		// 	if (agreement && agreement.slug) {
		// 		buttons.push({
		// 			slug: agreement.slug,
		// 			ctaText: `Manage Rules (${agreement.name})`
		// 		})
		// 	}
		// })

		return { content }
	}

	public static async getUser(options: { slack: Slack; userId: string }) {
		const { slack, userId } = options
		const decrypted = await services.data.decrypt({
			strToDecrypt: slack.encryptedAccessToken,
			privateKey: config.ENCRYPTION_KEY
		})

		const client = this.getClient(decrypted.data.accessToken)
		const result = await client.users.info({
			user: userId
		})

		return result.user
	}

	public static async joinChannels(options: {
		slack: Slack
		channelIds: string[]
	}) {
		const { slack, channelIds } = options
		const decrypted = await services.data.decrypt({
			strToDecrypt: slack.encryptedAccessToken,
			privateKey: config.ENCRYPTION_KEY
		})

		const client = this.getClient(decrypted.data.accessToken)

		if (!slack.teamId) {
			log.crit('Slack teamId not found', { slack })
			throw new Error('SLACK_NOT_FOUND')
		}

		const channels = await this.getSlackChannels({
			teamId: slack.teamId,
			client
		})

		const promises: Promise<any>[] = []
		channelIds.forEach(channelId => {
			const channel = channels?.find(c => c.id === channelId)
			if (!channel?.is_member) {
				promises.push(
					client.conversations.join({
						channel: channelId
					})
				)
			}
		})

		await Promise.allSettled(promises)
	}

	public static async getSlackChannels(options: {
		client: WebClient
		teamId: string
	}) {
		const { client, teamId } = options
		// https://api.slack.com/methods/conversations.list
		const result = await client.conversations.list({
			team_id: teamId,
			exclude_archived: true,
			// types: 'public_channel,private_channel',
			// Max limit is 1000
			limit: 800
		})

		if (result.response_metadata?.next_cursor) {
			// TODO: handle pagination
		}

		return result.channels
	}

	public static async sendMessage(options: {
		content: string
		channelIds: string[]
		slack: Slack
	}) {
		const { content, channelIds, slack } = options

		const decrypted = await services.data.decrypt({
			strToDecrypt: slack.encryptedAccessToken,
			privateKey: config.ENCRYPTION_KEY
		})

		const client = this.getClient(decrypted.data.accessToken)

		const promises = channelIds.map(channelId =>
			client.chat.postMessage({
				channel: channelId,
				text: content
			})
		)

		await Promise.all(promises)
	}

	/** Counts reactions for a message based on a rule */
	public static countReactions(options: {
		rule: Rule
		message: Message
		channelId: string
	}) {
		const { rule, message, channelId } = options
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

		const approverEmojis = rule.definition.approverEmojis.map(e => {
			return e.split('-')[0]
		})
		const proposerEmojis = rule.definition.proposerEmojis.map(e => {
			return e.split('-')[0]
		})
		const vetoerEmojis = rule.definition.vetoerEmojis.map(e => {
			return e.split('-')[0]
		})

		if (message.reactions) {
			message.reactions.forEach(reaction => {
				if (reaction.name) {
					const emoji = emojiMap.get(reaction.name)
					if (emoji) {
						const unicode = services.rule.emojiToUnicode(emoji)

						if (unicode) {
							const isApproverEmoji =
								(rule.definition.publishType ===
									MeemAPI.PublishType.PublishImmediately ||
									(rule.definition.publishType ===
										MeemAPI.PublishType.Proposal &&
										rule.definition.proposalShareChannel === channelId)) &&
								approverEmojis &&
								approverEmojis.includes(unicode)
							const isProposerEmoji =
								rule.definition.publishType === MeemAPI.PublishType.Proposal &&
								rule.definition.proposalShareChannel !== channelId &&
								proposerEmojis &&
								proposerEmojis.includes(unicode)
							const isVetoerEmoji =
								vetoerEmojis && vetoerEmojis.includes(unicode)

							if (isApproverEmoji) {
								if (!messageReactions.approver[unicode]) {
									messageReactions.approver[unicode] = 0
								}
								messageReactions.approver[unicode] += reaction.count ?? 0
							} else if (isProposerEmoji) {
								if (!messageReactions.proposer[unicode]) {
									messageReactions.proposer[unicode] = 0
								}
								messageReactions.proposer[unicode] += reaction.count ?? 0
							} else if (isVetoerEmoji) {
								if (!messageReactions.vetoer[unicode]) {
									messageReactions.vetoer[unicode] = 0
								}
								messageReactions.vetoer[unicode] += reaction.count ?? 0
							}
						}
					}
				}
			})
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
}