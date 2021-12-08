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

	public static async runMigrations(
		req: Request,
		res: Response
	): Promise<Response> {
		if (req.query.k !== config.SERVER_ADMIN_KEY) {
			// throw new Oops('NOT_AUTHORIZED')
			return res.status(403).json({
				status: 'failure',
				code: 'NOT_AUTHORIZED'
			})
		}
		await orm.runMigrations()

		return res.json({
			status: 'success'
		})
	}
}
