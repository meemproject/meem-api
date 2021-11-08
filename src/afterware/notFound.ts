import { Request, Response, NextFunction, Express } from 'express'

export default (app: Express) => {
	app.use((req: Request, res: Response, _next: NextFunction) => {
		return res.error(new Error('ROUTE_NOT_FOUND'))
	})
}
