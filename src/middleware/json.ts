import { Request, Response, NextFunction, Express } from 'express'

// Add apiVersion to all res.json outputs
export default (app: Express) => {
	app.use((req: Request, res: Response, next: NextFunction) => {
		const { json } = res

		// @ts-ignore
		res.json = function handleJsonResponse(data) {
			if (['/api/1.0', ''].includes(req.baseUrl)) {
				json.call(this, {
					...data,
					apiVersion: config.version
				})
			} else {
				json.call(this, data)
			}
		}
		next()
	})
}
