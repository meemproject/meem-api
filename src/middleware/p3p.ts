import { Request, Response, NextFunction, Express } from 'express'

export default (app: Express) => {
	app.use((req: Request, res: Response, next: NextFunction) => {
		// For IE to work properly
		res.setHeader('P3P', 'CP="NOI ADM DEV PSAi COM NAV OUR OTRo STP IND DEM"')
		next()
	})
}
