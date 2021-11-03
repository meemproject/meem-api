import { Request, Response, NextFunction, Express } from 'express'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

const pid = uuidv4()

export default (app: Express) => {
	app.use((req: Request, res: Response, next: NextFunction) => {
		if (config.ENABLE_REQUEST_LOGGING) {
			log.info(
				`${pid} || ${DateTime.utc().toISO()}  ${req.method}: ${req.path}`
			)
		}
		next()
	})
}
