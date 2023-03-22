import {
	InteractionResponseType,
	InteractionType,
	verifyKey
} from 'discord-interactions'
import { Request, Response } from 'express'

export default class WebhookController {
	public static async handleDiscordWebhook(
		req: Request,
		res: Response
	): Promise<Response> {
		log.debug('handleDiscordWebhook')
		// log.debug(req.body)
		// log.debug(req.headers)
		// return res.json({
		// 	type: req.body.type
		// })
		const signature = req.get('X-Signature-Ed25519')
		const timestamp = req.get('X-Signature-Timestamp')

		if (!signature || !timestamp) {
			throw new Error('MISSING_PARAMETERS')
		}

		const isValidRequest = verifyKey(
			// req.rawBody,
			Buffer.from(JSON.stringify(req.body)),
			signature,
			timestamp,
			config.DISCORD_PUBLIC_KEY
		)
		log.debug({
			body: req.body,
			rawBody: req.rawBody,
			headers: req.headers,
			signature,
			timestamp,
			isValidRequest
		})

		if (!isValidRequest) {
			// throw new Error('NOT_AUTHORIZED')
			return res.status(401).send({ error: 'Bad request signature ' })
		}

		switch (req.body.type) {
			case InteractionType.PING:
				return res.send({
					type: InteractionResponseType.PONG
				})

			case InteractionType.APPLICATION_COMMAND:
				return res.send({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: 'Hello world'
					}
				})

			default:
				break
		}

		throw new Error('UNKNOWN_REQUEST')
	}
}
