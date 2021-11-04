import { Request, Response, NextFunction, Express } from 'express'
import errorHandler from '../lib/errorHandler'

export default (app: Express) => {
	app.use((err: any, req: Request, res: Response, next: NextFunction) => {
		if (err) {
			errorHandler(res, err)
			return
		}

		next()
	})
}
