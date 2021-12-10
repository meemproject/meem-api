import { Request, Response } from 'express'

export default class ConfigController {
	public static async runMigrations(
		req: Request,
		res: Response
	): Promise<Response> {
		await orm.runMigrations()

		return res.json({
			status: 'success'
		})
	}

	public static async runSync(req: Request, res: Response): Promise<Response> {
		await orm.runSync()

		return res.json({
			status: 'success'
		})
	}

	public static async meemSync(req: Request, res: Response): Promise<Response> {
		await services.contractEvents.meemSync()

		return res.json({
			status: 'success'
		})
	}
}