import coreExpress, { Express } from 'express'
import ConfigController from '../controllers/ConfigController'
import MeemController from '../controllers/MeemController'
import TestController from '../controllers/TestController'
import extendedRouter from '../core/router'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()

	app.use('/api/1.0/', router)

	router.getAsync('/config', ConfigController.getConfig)
	router.getAsync('/whitelist', MeemController.getWhitelist)
	router.getAsync('/meems', MeemController.getMeems)
	router.getAsync('/meems/:tokenId', MeemController.getMeem)
	router.postAsync('/meems/mint', MeemController.mintMeem)
	router.postAsync('/meems/create-image', MeemController.createMeemImage)
	router.getAsync('/tokenOwner', MeemController.getTokenInfo)
	router.getAsync('/ipfs', MeemController.getIPFSFile)

	if (config.ENABLE_TEST_ENDPOINTS) {
		router.getAsync('/test/emit', TestController.testEmit)
	}
}
