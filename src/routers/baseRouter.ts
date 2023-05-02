import coreExpress, { Express, Request, Response, NextFunction } from 'express'
import extendedRouter from '../core/router'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()

	app.use('/', router)

	router.getAsync('/', (req: Request, res: Response, _next: NextFunction) => {
		return res.json({
			status: 'success',
			hello: 'Meem'
		})
	})
}
