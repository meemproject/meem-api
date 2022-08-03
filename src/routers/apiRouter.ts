import coreExpress, { Express } from 'express'
import multer from 'multer'
import ConfigController from '../controllers/ConfigController'
import ContractController from '../controllers/ContractController'
import MeemContractController from '../controllers/MeemContractController'
import MeemController from '../controllers/MeemController'
import MeemIdController from '../controllers/MeemIdController'
// import NFTController from '../controllers/NFTController'
import TestController from '../controllers/TestController'
// import TweetController from '../controllers/TweetController'
import TypesController from '../controllers/TypesController'
// import WebhookController from '../controllers/WebhookController'
import extendedRouter from '../core/router'
import userLoggedInPolicy from '../policies/UserLoggedInPolicy'
// import userLoggedInPolicy from '../policies/UserLoggedInPolicy'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()
	const imageRouter = extendedRouter()

	const storage = multer.memoryStorage()
	const upload = multer({ storage })

	app.use('/api/1.0/', router)
	app.use('/images/1.0/', imageRouter)

	router.getAsync('/getNonce', MeemIdController.getNonce)
	router.postAsync('/login', MeemIdController.login)

	router.getAsync('/me', MeemIdController.getMe)

	router.getAsync('/config', ConfigController.getConfig)

	router.postAsync('/isSlugAvailable', MeemContractController.isSlugAvailable)
	router.postAsync('/meemContracts', MeemContractController.createMeemContract)
	router.patchAsync(
		'/meemContracts/:meemContractId',
		MeemContractController.updateMeemContract
	)
	router.getAsync(
		'/meemContracts/:meemContractId/guilds',
		MeemContractController.getGuilds
	)
	router.postAsync(
		'/meemContracts/:meemContractId/guilds',
		MeemContractController.createGuild
	)
	router.postAsync(
		'/meemContracts/:meemContractId/integrations/:integrationId',
		MeemContractController.createOrUpdateMeemContractIntegration
	)
	router.getAsync('/meems', MeemController.getMeems)
	router.getAsync('/meems/:tokenId', MeemController.getMeem)
	router.getAsync('/meems/:tokenId/children', MeemController.getChildMeems)
	router.getAsync('/clippings', MeemController.getClippings)
	router.postAsync('/clippings/status', MeemController.checkClippingStatus)
	router.postAsync('/meems/mintOriginal', MeemController.mintOriginalMeem)
	router.postAsync('/meems/create-image', MeemController.createMeemImage)
	router.getAsync('/ipfs', MeemController.getIPFSFile)

	if (config.ENABLE_URL_SCRAPER) {
		router.getAsync('/screenshot', MeemController.getScreenshot)
	}

	imageRouter.postAsync('/meems/create-image', MeemController.createMeemImage)

	imageRouter.postAsync(
		'/metadata',
		// TODO: Authentication of some kind?
		// userLoggedInPolicy,
		upload.any(),
		MeemController.saveMetadata
	)

	// Projects
	// router.postAsync('/projects', MeemController.createMeemProject)

	router.postAsync(
		'/contracts',
		userLoggedInPolicy,
		ContractController.createContract
	)

	router.postAsync(
		'/contractInstances',
		userLoggedInPolicy,
		ContractController.addContractInstance
	)

	router.patchAsync(
		'/walletContractInstances/:contractInstanceId',
		userLoggedInPolicy,
		ContractController.updateWalletContractInstance
	)

	router.postAsync(
		'/bundles',
		userLoggedInPolicy,
		ContractController.createBundle
	)

	router.putAsync(
		'/bundles/:bundleId',
		userLoggedInPolicy,
		ContractController.updateBundle
	)

	router.postAsync('/generateTypes', TypesController.generateTypes)

	if (config.ENABLE_TEST_ENDPOINTS) {
		router.getAsync('/test/emit', TestController.testEmit)
		router.getAsync('/test/error', TestController.testError)
		router.getAsync('/test/wrapped', TestController.testWrapped)
		router.getAsync(
			'/test/saveSubscription',
			TestController.testSaveSubscription
		)
		router.getAsync(
			'/test/getSubscriptions',
			TestController.testGetSubscriptions
		)
		router.getAsync('/test/getUserJWT', TestController.testGetUserJWT)
		router.getAsync('/test/getUserJWT', TestController.testGetUserJWT)
		router.getAsync('/test/testData', TestController.testData)
		router.getAsync('/test/testPromptsCron', TestController.testPromptsCron)
	}
}
