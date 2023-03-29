import coreExpress, { Express } from 'express'
import DiscordController from '../controllers/DiscordController'
import RuleController from '../controllers/RuleController'
import SlackController from '../controllers/SlackController'
import TwitterController from '../controllers/TwitterController'
import WebhookController from '../controllers/WebhookController'
import extendedRouter from '../core/router'
import userLoggedInPolicy from '../policies/UserLoggedInPolicy'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()

	app.use('/api/1.0/symphony/', router)

	router.postAsync(
		'/webhooks/discord/interactions',
		WebhookController.handleDiscordWebhook
	)

	router.getAsync(
		'/discord/channels',
		userLoggedInPolicy,
		DiscordController.getChannels
	)
	router.getAsync(
		'/discord/roles',
		userLoggedInPolicy,
		DiscordController.getRoles
	)
	router.getAsync(
		'/discord/emojis',
		userLoggedInPolicy,
		DiscordController.getEmojis
	)
	router.getAsync(
		'/discord/inviteBot',
		userLoggedInPolicy,
		DiscordController.inviteBot
	)
	router.deleteAsync(
		'/discord',
		userLoggedInPolicy,
		DiscordController.disconnect
	)
	router.getAsync('/twitter/auth', TwitterController.auth)
	router.getAsync('/twitter/callback', TwitterController.callback)
	router.getAsync('/slack/auth', SlackController.auth)
	router.getAsync('/slack/callback', SlackController.callback)
	router.getAsync(
		'/slack/channels',
		userLoggedInPolicy,
		SlackController.getSlackChannels
	)
	router.postAsync('/slack/events', SlackController.events)
	router.deleteAsync(
		'/twitter',
		userLoggedInPolicy,
		TwitterController.disconnect
	)
	router.deleteAsync('/slack', userLoggedInPolicy, SlackController.disconnect)
	router.postAsync('/saveRule', userLoggedInPolicy, RuleController.saveRule)
	router.postAsync(
		'/removeRules',
		userLoggedInPolicy,
		RuleController.removeRules
	)
}
