// import { createClient } from '@supabase/supabase-js'
// import { axios } from "@pipedream/platform"
// export default defineComponent({
//   props: {
//     supabase: {
//       type: "app",
//       app: "supabase",
//     },
//     discord_bot: {
//       type: "app",
//       app: "discord_bot",
//     }
//   },
//   async run({steps, $}) {

import { createClient } from '@supabase/supabase-js'
import { Guild, ThreadChannel } from 'discord.js'
import _ from 'lodash'
import request from 'superagent'
import { MeemAPI } from '../types/meem.generated'

export default class MeemHelpDeskService {
	public static async handleMessage(data: {
		message: Omit<
			MeemAPI.IWebhookBody,
			'rule' | 'totalApprovals' | 'totalProposers' | 'totalVetoers'
		>
	}) {
		const { message } = data
		const meemBotId = config.DISCORD_APP_ID
		const internalChannelId = config.MEEM_HELPDESK_DISCORD_CHANNEL_ID

		let conversation

		const supabase = createClient(
			`https://${config.MEEM_HELPDESK_SUPABASE_SUBDOMAIN}.supabase.co`,
			`${config.MEEM_HELPDESK_SUPABASE_SERVICE_KEY}`
		)

		if (!message.inputMetadata || !message.user) {
			return
		}

		const mentionedUsers = _.keys(
			Object.fromEntries(message.inputMetadata.mentions.users)
		)

		// Bot mention
		if (
			message &&
			message.user?.id !== meemBotId &&
			mentionedUsers.includes(meemBotId) &&
			message.channelId !== internalChannelId
		) {
			const guild = (
				await request
					.get(
						`https://discord.com/api/guilds/${message.inputMetadata.guildId}`
					)
					.set({ Authorization: `Bot ${config.DISCORD_APP_TOKEN}` })
					.send()
			).body as unknown as Guild

			const internalThread = (
				await request
					.post(`https://discord.com/api/channels/${internalChannelId}/threads`)
					.set({ Authorization: `Bot ${config.DISCORD_APP_TOKEN}` })
					.send({
						name: guild.name
					})
			).body as unknown as ThreadChannel

			await request
				.post(`https://discord.com/api/channels/${internalThread.id}/messages`)
				.set({ Authorization: `Bot ${config.DISCORD_APP_TOKEN}` })
				.send({
					content: `<@${message.user.id}> (${
						guild.name
					}): ${message.content.replace(`<@${meemBotId}> `, '')}`
				})

			const { data: conversations, error: conversationsError } = await supabase
				.from('Conversations')
				.select()
				.eq('origin_channel_id', `${message.channelId}`)
				.eq('origin_message_id', `${message.messageId}`)

			if (conversationsError) {
				log.error(conversationsError)
			} else {
				if (conversations.length < 1) {
					const { data: newConvo } = await supabase
						.from('Conversations')
						.insert({
							origin_message_id: `${message.messageId}`,
							origin_channel_id: `${message.channelId}`,
							origin_guild_id: `${guild.id}`,
							internal_thread_id: internalThread.id
						})
						.select()

					conversation = newConvo
				} else {
					conversation = conversations[0]
				}
			}
		}

		if (
			message &&
			message.user?.id !== meemBotId &&
			message.channelId !== internalChannelId
		) {
			const { data: originConversations } = await supabase
				.from('Conversations')
				.select()
				.eq('origin_thread_id', `${message.channelId}`)

			if (originConversations && originConversations.length > 0) {
				const guild = (
					await request
						.get(
							`https://discord.com/api/guilds/${message.inputMetadata.guildId}`
						)
						.set({ Authorization: `Bot ${config.DISCORD_APP_TOKEN}` })
						.send()
				).body as unknown as Guild
				conversation = originConversations[0]
				if (conversation.internal_thread_id) {
					await request
						.post(
							`https://discord.com/api/channels/${conversation.internal_thread_id}/messages`
						)
						.set({ Authorization: `Bot ${config.DISCORD_APP_TOKEN}` })
						.send({
							content: `<@${message.user.id}> (${
								guild.name
							}): ${message.content.replace(`<@${meemBotId}> `, '')}`
						})
				}
			} else {
				const { data: internalConversations } = await supabase
					.from('Conversations')
					.select()
					.eq('internal_thread_id', `${message.channelId}`)

				if (internalConversations && internalConversations.length > 0) {
					conversation = internalConversations[0]
					let toOriginThreadId = conversation.origin_thread_id
					if (!toOriginThreadId) {
						const toOriginThread = (
							await request
								.post(
									`https://discord.com/api/channels/${conversation.origin_channel_id}/messages/${conversation.origin_message_id}/threads`
								)
								.set({ Authorization: `Bot ${config.DISCORD_APP_TOKEN}` })
								.send({
									name: 'Meem'
								})
						).body as unknown as ThreadChannel

						toOriginThreadId = toOriginThread.id
						await supabase
							.from('Conversations')
							.update({ origin_thread_id: `${toOriginThread.id}` })
							.eq('id', conversation.id)
					}

					await request
						.post(
							`https://discord.com/api/channels/${toOriginThreadId}/messages`
						)
						.set({ Authorization: `Bot ${config.DISCORD_APP_TOKEN}` })
						.send({
							content: message.content
						})
				}
			}
		}

		return conversation
	}
}
