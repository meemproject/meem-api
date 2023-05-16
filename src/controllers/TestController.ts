import { Request, Response } from 'express'

export default class TestController {
	public static async releaseLock(req: Request, res: Response) {
		await services.ethers.releaseLock(+(req.query.chainId as string))

		return res.json({
			status: 'success'
		})
	}

	public static async testWebhook(
		req: Request,
		res: Response
	): Promise<Response> {
		log.debug({
			body: req.body,
			query: req.query,
			params: req.params
		})

		return res.json({
			status: 'success'
		})
	}

	public static async testEmail(
		req: Request,
		res: Response
	): Promise<Response> {
		await services.aws.sendEmail({
			to: ['ken@meem.wtf'],
			body: '<h1>Testing email</h1>',
			subject: 'Testing email'
		})

		return res.json({
			status: 'success'
		})
	}
}
