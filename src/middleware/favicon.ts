import { Request, Response, NextFunction, Express } from 'express'

export default (app: Express) => {
	app.use(
		'/favicon.ico',
		(_req: Request, res: Response, _next: NextFunction) => {
			res.end()
		}
	)
}
