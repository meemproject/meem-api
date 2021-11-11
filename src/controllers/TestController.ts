import { Request, Response } from 'express'
import { MeemAPI } from '../types/meem.generated'

export default class ConfigController {
	public static async testEmit(req: Request, res: Response): Promise<Response> {
		// sockets?.emit

		// await services.db.getSubscriptions({
		// 	subscriptionKey: '1234'
		// })

		// await services.db.removeSubscriptions({
		// 	connectionId: '1234'
		// })

		await sockets?.emit({
			subscription: MeemAPI.MeemEvent.MeemMinted,
			eventName: MeemAPI.MeemEvent.MeemMinted,
			data: {
				tokenId: '234',
				transactionHash: 'balksjdflakjdsf'
			}
		})

		return res.json({
			config: { version: config.version }
		})
	}
}
