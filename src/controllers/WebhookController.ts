import { Request, Response } from 'express'

export default class WebhookController {
	public static async handleMoralisWebhook(
		req: Request,
		res: Response
	): Promise<Response> {
		log.debug({ body: req.body })
		/*
		{
			"body": {
				"triggerName": "afterSave",
				"object": {
					"block_timestamp": {
						"__type": "Date",
						"iso": "2021-12-07T22:30:23.000Z"
					},
					"transaction_hash": "0x0ca561e8aa632c4cb40ec9b0f355d9bb53bbbc61c12687ded599f9673688ce3a",
					"log_index": 10,
					"from": "0x0000000000000000000000000000000000000000",
					"to": "0xba343c26ad4387345edbb3256e62f4bb73d68a04",
					"tokenId": "100041",
					"address": "0x87e5882fa0ea7e391b7e31e8b23a8a38f35c84ac",
					"block_hash": "0x85c387ff6d4813acd3e4cab7ea8afb114360fe9052901547e1409e2f178ee585",
					"block_number": 9775492,
					"transaction_index": 7,
					"createdAt": "2021-12-07T22:30:23.676Z",
					"updatedAt": "2021-12-07T22:30:23.676Z",
					"objectId": "djdCJC9uLKmMz9F5DBOaQQxW",
					"className": "MeemTransfer"
				},
				"master": true,
				"log": {
					"options": {
						"jsonLogs": false,
						"logsFolder": "./logs",
						"verbose": false
					},
					"appId": "xUYLdVsvxpWm1YRZfyj2uqLkJbN39gfm7fI00qyg"
				},
				"context": {},
				"installationId": "cloud"
			}
		}
		*/
		return res.json({
			config: { version: config.version }
		})
	}
}
