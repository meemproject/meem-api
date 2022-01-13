import { Request, Response, NextFunction, Express } from 'express'

export default (app: Express) => {
	app.use((req: Request, _res: Response, next: NextFunction) => {
		req.limit =
			req.query.limit && +req.query.limit > 0
				? +req.query.limit
				: config.DEFAULT_PAGINATION_LIMIT

		req.page = req.query.page && +req.query.page > 0 ? +req.query.page : 0

		next()
	})
}
