import { Request, Response, NextFunction, Express } from 'express'
import errorHandler from '../core/errorHandler'

export default (app: Express) => {
	app.use((req: Request, res: Response, next: NextFunction) => {
		res.error = errorKey => {
			return errorHandler(res, errorKey)
		}
		next()
	})
}
