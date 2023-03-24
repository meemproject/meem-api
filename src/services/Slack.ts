import { WebClient } from '@slack/web-api'
import type { Message } from '@slack/web-api/dist/response/ConversationsHistoryResponse'
import emojiMap from 'emoji-name-map'
import Rule from '../models/Rule'
import Slack from '../models/Slack'
import { MeemAPI } from '../types/meem.generated'

export default class SlackService {
	public static getClient(accessToken: string) {
		return new WebClient(accessToken)
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
								rule.definition.approverEmojis &&
								rule.definition.approverEmojis.includes(unicode)
							const isProposerEmoji =
								rule.definition.publishType === MeemAPI.PublishType.Proposal &&
								rule.definition.proposalShareChannel !== channelId &&
								rule.definition.proposerEmojis &&
								rule.definition.proposerEmojis.includes(unicode)
							const isVetoerEmoji =
								rule.definition.vetoerEmojis &&
								rule.definition.vetoerEmojis.includes(unicode)

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