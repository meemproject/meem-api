import coreExpress, { Express } from 'express'
import ConfigController from '../controllers/ConfigController'
import extendedRouter from '../core/router'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()

	// const configController = new ConfigController()

	app.use('/api/1.0/', router)

	router.getAsync('/config', ConfigController.getConfig)
}
