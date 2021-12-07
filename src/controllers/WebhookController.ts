import { Request, Response } from 'express'

export default class WebhookController {
	public static async handleMoralisWebhook(
		req: Request,
		res: Response
	): Promise<Response> {
		log.debug({ body: req.body })
		return res.json({
			config: { version: config.version }
		})
	}
}
