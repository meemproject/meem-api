import { Request, Response } from 'express'

export default class ConfigController {
	public static async getConfig(
		req: Request,
		res: Response
	): Promise<Response> {
		return res.json({
			config: { version: config.version }
		})
	}
}
