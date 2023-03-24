// import { decode, JwtPayload } from 'jsonwebtoken'
import request from 'superagent'

export enum Events {
	DiscordBotInvited = 'discordBotInvited',
	DiscordBotActivated = 'discordBotActivated',
	DiscordBotDisconnected = 'discordBotDisconnected',
	DiscordBotKicked = 'discordBotKicked',
	TwitterAuthStarted = 'twitterAuthStarted',
	TwitterAuthCompleted = 'twitterAuthCompleted',
	TwitterDisconnected = 'twitterDisconnected',
	SlackAuthStarted = 'slackAuthStarted',
	SlackAuthCompleted = 'slackAuthCompleted',
	SlackDisconnected = 'slackDisconnected',
	RulesSaved = 'rulesSaved',
	RulesDeleted = 'rulesDeleted',
	DiscordSlashRules = 'discordSlashRules',
	RuleMatched = 'ruleMatched'
}

export default class AnalyticsService {
	public static track(
		events: {
			/** Event name */
			name: string

			/** The user initiating the event */
			userId?: string

			/** The associated agreementId */
			agreementId?: string | null

			/** Additional parameters */
			params?: Record<string, any>
		}[]
	) {
		const body = {
			client_id: config.GA_CLIENT_ID,
			events: events.map(e => {
				const { userId } = e

				return {
					user_id: userId,
					name: e.name,
					params: {
						...e.params,
						agreementId: e.agreementId
					}
				}
			})
		}

		log.trace(body)

		request
			.post(
				`https://www.google-analytics.com/mp/collect?measurement_id=${config.GA_MEASUREMENT_ID}&api_secret=${config.GA_API_KEY}`
			)
			.send(body)
			.then(() => {
				log.trace('Sent analytics')
			})
			.catch(e => {
				log.crit(e)
			})
	}
}
