import coreExpress, { Express } from 'express'
import ConfigController from '../controllers/ConfigController'
import DiscordController from '../controllers/DiscordController'
import RuleController from '../controllers/RuleController'
import SlackController from '../controllers/SlackController'
import TwitterController from '../controllers/TwitterController'
import WebhookController from '../controllers/WebhookController'
import extendedRouter from '../core/router'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()

	app.use('/api/1.0/symphony/', router)

	router.getAsync('/config', ConfigController.getConfig)
	router.postAsync(
		'/webhooks/discord/interactions',
		WebhookController.handleDiscordWebhook
	)

	router.getAsync('/discord/channels', DiscordController.getChannels)
	router.getAsync('/discord/roles', DiscordController.getRoles)
	router.getAsync('/discord/emojis', DiscordController.getEmojis)
	router.getAsync('/discord/inviteBot', DiscordController.inviteBot)
	router.deleteAsync('/discord', DiscordController.disconnect)
	router.getAsync('/twitter/auth', TwitterController.auth)
	router.getAsync('/twitter/callback', TwitterController.callback)
	router.getAsync('/slack/auth', SlackController.auth)
	router.getAsync('/slack/callback', SlackController.callback)
	router.getAsync('/slack/channels', SlackController.getSlackChannels)
	router.postAsync('/slack/events', SlackController.events)
	router.deleteAsync('/twitter', TwitterController.disconnect)
	router.postAsync('/saveRule', RuleController.saveRule)
	router.postAsync('/removeRules', RuleController.removeRules)
}
